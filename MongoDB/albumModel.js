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
  likes:{
    type:Number,
    default: 0,
  },
  views:{
    type:Number,
    default: 0,
  }
});

module.exports = mongoose.model('Albums', albumSchema);