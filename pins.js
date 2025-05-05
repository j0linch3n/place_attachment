const mongoose = require('mongoose');

const pinSchema = new mongoose.Schema({
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  message: String,
  name: String,
  residence: String,
  image: String,
});

const Pin = mongoose.model('Pin', pinSchema);

module.exports = Pin;