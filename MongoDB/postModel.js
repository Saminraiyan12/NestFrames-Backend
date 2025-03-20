const mongoose = require("mongoose");
const commentSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
    },
  },
  { timestamps: true }
);
const postSchema = new mongoose.Schema(
  {
    photo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Photos",
    },
    album: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Albums",
    },
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
    },
    likedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Users",
      },
    ],
    comments: [commentSchema],
    caption: String,
    privacy: Boolean,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Posts", postSchema);
