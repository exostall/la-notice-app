const crypto = require('crypto');
const SECRET = process.env.TILE_SECRET || '';
// signature d'un lien de tuile : nom + expiration + compte, valable quelques minutes
function sign(name, exp, uid) {
  return crypto.createHmac('sha256', SECRET).update(name + '.' + exp + '.' + uid).digest('base64url').slice(0, 32);
}
function check(name, exp, uid, s) {
  if (!SECRET || !name || !exp || !uid || !s) return false;
  const good = Buffer.from(sign(name, exp, uid));
  const got = Buffer.from(String(s));
  return good.length === got.length && crypto.timingSafeEqual(good, got);
}
module.exports = { sign, check };
