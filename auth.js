// auth.js — password hashing (scrypt, built into Node) + simple bearer-token sessions.
const crypto = require('crypto');

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(':');
  const check = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(check, 'hex'));
}

function makeToken() {
  return crypto.randomBytes(32).toString('hex');
}

// In-memory session store: token -> userId
const sessions = new Map();

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token || !sessions.has(token)) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  req.userId = sessions.get(token);
  next();
}

module.exports = { hashPassword, verifyPassword, makeToken, sessions, requireAuth };
