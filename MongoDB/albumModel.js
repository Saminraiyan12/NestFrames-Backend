const mongoose = require('mongoose');

const albumSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  coverPhoto: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Photos",
  },
  users: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User" 
  }],
  photos: [{ 
    type: mongoose.Schema.Types.ObjectId,
    ref: "Photos" 
  }],
});

module.exports = mongoose.model('Albums', albumSchema);