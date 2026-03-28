const jwt = require('jsonwebtoken');

const SESSION_TTL_MS = 90 * 60 * 1000;
const SESSION_TTL_HUMAN = '90m';

const getJwtSecret = () => process.env.JWT_SECRET || '';

const signSessionToken = (payload) => jwt.sign(payload, getJwtSecret(), { expiresIn: SESSION_TTL_HUMAN });

const verifyToken = (token) => jwt.verify(token, getJwtSecret());

const parseBearerToken = (headerValue = '') => {
  if (!headerValue || typeof headerValue !== 'string') return null;
  const [scheme, token] = headerValue.split(' ');
  if (scheme !== 'Bearer' || !token) return null;
  return token.trim();
};

module.exports = {
  SESSION_TTL_MS,
  signSessionToken,
  verifyToken,
  parseBearerToken
};

