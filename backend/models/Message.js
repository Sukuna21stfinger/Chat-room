const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  user:       { type: String },
  message:    { type: String },
  room:       { type: String, required: true },
  createdAt:  { type: Date, default: Date.now, expires: 1800 }, // Auto-delete after 30 mins (1800 seconds)
  type:       { type: String, enum: ['text', 'gif', 'system'], default: 'text' },
  attachment: { type: String },
  reactions:  { type: Map, of: [String], default: {} }
});

// Index for efficient querying
messageSchema.index({ room: 1, createdAt: -1 });
// TTL index for auto-deletion (30 minutes)
messageSchema.index({ createdAt: 1 }, { expireAfterSeconds: 1800 });

module.exports = mongoose.model('Message', messageSchema);
