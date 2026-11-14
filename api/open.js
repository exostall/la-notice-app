// Ouverture d'une fiche : vérifie le compte, l'appareil et les CGU auprès de Supabase,
// journalise la consultation, puis renvoie des liens de tuiles signés valables 5 minutes.
const { sign } = require('./_sign');
const MANIFEST = require('../tiles/manifest.json');
const SB_URL = process.env.SUPABASE_URL || 'https://aszdfmpwyhpcsokrwmog.supabase.co';
const SB_KEY = process.env.SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_O85LeRosp83i52TAjaeeYg__2MfOGiJ';
const TTL = 300;

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ ok: false });
  const auth = req.headers.authorization || '';
  let body = req.body || {};
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (_) { body = {}; } }
  const { fiche, device, log } = body;
  if (!auth.startsWith('Bearer ') || !MANIFEST[fiche] || typeof device !== 'string') {
    return res.status(400).json({ ok: false, reason: 'bad_request' });
  }
  let d;
  try {
    const r = await fetch(SB_URL + '/rest/v1/rpc/open_fiche', {
      method: 'POST',
      headers: { apikey: SB_KEY, Authorization: auth, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_fiche: fiche, p_device: device, p_log: log !== false }),
    });
    if (r.status === 401 || r.status === 403) return res.status(401).json({ ok: false, reason: 'not_signed_in' });
    d = await r.json();
  } catch (e) {
    return res.status(502).json({ ok: false, reason: 'server' });
  }
  if (!d || !d.ok) return res.status(403).json({ ok: false, reason: (d && d.reason) || 'denied' });
  const exp = Math.floor(Date.now() / 1000) + TTL;
  const urls = {};
  for (const n of MANIFEST[fiche]) urls[n] = '/api/t?n=' + n + '&e=' + exp + '&u=' + d.uid + '&s=' + sign(n, exp, d.uid);
  return res.status(200).json({ ok: true, name: d.name, email: d.email, exp, urls });
};
