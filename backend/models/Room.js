const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  name:        { type: String, required: true, unique: true },
  description: { type: String, default: '' },
  passcode:    { type: String, default: '' },
  createdBy:   { type: String, default: 'system' },
  isGeneral:   { type: Boolean, default: false },
  createdAt:   { type: Date, default: Date.now },
  lastActivityAt: { type: Date, default: Date.now },
  autoDeleteAt: { type: Date, default: null }
}, { timestamps: true });

// Index for auto-deletion
roomSchema.index({ autoDeleteAt: 1 }, { sparse: true });

module.exports = mongoose.model('Room', roomSchema);
