const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  name:        { type: String, required: true, unique: true },
  description: { type: String, default: '' },
  createdBy:   { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Room', roomSchema);
