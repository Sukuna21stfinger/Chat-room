const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  userId:    { type: String, required: true, unique: true },
  username:  { type: String, required: true },
  isOnline:  { type: Boolean, default: false },
  isAdmin:   { type: Boolean, default: false },
  expiresAt: { type: Date, default: () => new Date(Date.now() + 90 * 60 * 1000), expires: 0 }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
