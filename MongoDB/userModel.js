const mongoose = require("mongoose");
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
const userSchema = new mongoose.Schema({
  fullname: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  photos: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Photos",
    }],
  profilePic: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Photos",
  },
  taggedPhotos: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Photos",
    }],
  albums: [albumSchema],
  friends: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    }],
  friendRequestsSent: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    }],
  friendRequestsReceived: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    }],
  conversations: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversations",
    }],
});

module.exports = mongoose.model("User", userSchema);
