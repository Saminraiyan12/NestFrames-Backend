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
  posts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Post" }],
  friends: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  friendRequestsSent: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  friendRequestsReceived: [
    { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  ],
  conversations: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversations",
    },
  ],
});

module.exports = mongoose.model("User", userSchema);
