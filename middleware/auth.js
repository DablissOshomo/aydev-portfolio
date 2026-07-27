const crypto = require("crypto");

function timingSafeEqual(a, b) {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) {
    // Still do a comparison of equal length to avoid leaking length
    // via timing, then return false.
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

function checkPassword(candidate) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    // Fail closed: if no password is configured, nobody gets in.
    // (See .env.example — this must be set for the admin to work.)
    return false;
  }
  return timingSafeEqual(candidate, expected);
}

function requireAuth(req, res, next) {
  if (req.session && req.session.authed) return next();
  return res.redirect("/admin/login");
}

module.exports = { requireAuth, checkPassword };
