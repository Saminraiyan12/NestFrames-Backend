const mongoose = require("mongoose");

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
  posts: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Posts",
    }],
  profilePic: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Photos",
  },
  albums: [{
    type: mongoose.Schema.Types.ObjectId, 
    ref:"Albums"
  }],
  albumRequests :[{
    type: mongoose.Schema.Types.ObjectId,
    ref:"Albums"
  }],
  friends: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
    }],
  friendRequestsSent: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
    }],
  friendRequestsReceived: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
    }],
  conversations: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversations",
    }],
  createdAt:{
    type:Date,
    default:Date.now()
  }
});

module.exports = mongoose.model("Users", userSchema);
