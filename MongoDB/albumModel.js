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
    ref: "Users" 
  }],
  posts: [{ 
    type: mongoose.Schema.Types.ObjectId,
    ref: "Posts" 
  }],
  requests:[{
    type:mongoose.Schema.Types.ObjectId,
    ref:"Users"
  }],
  likedBy:[{
    type:mongoose.Schema.Types.ObjectId,
    ref:"Users"
  }],
  views:{
    type:Number,
    default: 0,
  }
});

module.exports = mongoose.model('Albums', albumSchema);