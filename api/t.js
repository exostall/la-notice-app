// Sert une tuile uniquement avec un lien signé non expiré. Les tuiles ne sont pas dans /public.
const fs = require('fs');
const path = require('path');
const { check } = require('./_sign');

module.exports = (req, res) => {
  const { n, e, u, s } = req.query || {};
  const now = Math.floor(Date.now() / 1000);
  if (!/^[0-9a-f]{14}$/.test(n || '') || !/^\d+$/.test(e || '') || +e < now || +e > now + 600 || !check(n, e, u, s)) {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(403).send('Lien expiré');
  }
  let buf;
  try { buf = fs.readFileSync(path.join(process.cwd(), 'tiles', n + '.webp')); }
  catch (_) { return res.status(404).send('Introuvable'); }
  res.setHeader('Content-Type', 'image/webp');
  res.setHeader('Cache-Control', 'private, max-age=' + Math.max(0, +e - now) + ', no-transform');
  res.setHeader('Content-Disposition', 'inline');
  res.setHeader('X-Robots-Tag', 'noindex');
  return res.status(200).send(buf);
};
