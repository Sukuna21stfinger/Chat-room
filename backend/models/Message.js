const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  user:       { type: String },
  message:    { type: String },
  room:       { type: String, required: true },
  createdAt:  { type: Date, default: Date.now, expires: 3600 },
  type:       { type: String, enum: ['text', 'gif', 'system'], default: 'text' },
  attachment: { type: String },
  reactions:  { type: Map, of: [String], default: {} }
});

module.exports = mongoose.model('Message', messageSchema);
