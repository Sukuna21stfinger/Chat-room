const Session = require('../models/Session');
const { parseBearerToken, verifyToken } = require('../utils/auth');

const loadActiveSession = async (token) => {
  const payload = verifyToken(token);
  if (!payload?.sid || !payload?.userId || !payload?.username || !payload?.roomId) {
    throw new Error('Invalid token payload');
  }

  const session = await Session.findOne({
    sessionId: payload.sid,
    userId: payload.userId,
    revokedAt: null,
    expiresAt: { $gt: new Date() }
  });

  if (!session) throw new Error('Session is not active');
  return { payload, session };
};

const requireAuth = async (req, res, next) => {
  try {
    const token = parseBearerToken(req.headers.authorization);
    if (!token) return res.status(401).json({ message: 'Missing auth token' });

    const { payload, session } = await loadActiveSession(token);
    req.auth = {
      userId: payload.userId,
      username: payload.username,
      roomId: payload.roomId,
      sessionId: payload.sid,
      isAdmin: session.isAdmin || false
    };

    Session.updateOne({ _id: session._id }, { $set: { lastSeenAt: new Date() } }).catch(() => {});
    return next();
  } catch (_) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
};

module.exports = {
  requireAuth,
  loadActiveSession
};

