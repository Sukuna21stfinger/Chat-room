const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true, index: true },
  userId: { type: String, required: true, index: true },
  username: { type: String, required: true, index: true },
  roomId: { type: String, required: true, index: true },
  isAdmin: { type: Boolean, default: false },
  revokedAt: { type: Date, default: null, index: true },
  revokeReason: { type: String, default: null },
  lastSeenAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true, index: { expires: 0 } }
}, { timestamps: true });

module.exports = mongoose.model('Session', sessionSchema);
