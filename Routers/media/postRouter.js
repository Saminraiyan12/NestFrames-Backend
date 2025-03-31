const express = require("express");
const Photos = require("../../MongoDB/photoModel");
const Posts = require("../../MongoDB/postModel");
const Albums = require("../../MongoDB/albumModel");
const Users = require("../../MongoDB/userModel");
const { S3 } = require("@aws-sdk/client-s3");
const s3 = new S3({ region: "us-east-2" });
const { Server } = require("socket.io");
const multer = require("multer");
const multerS3 = require("multer-s3");
const { verifyToken } = require("../../Middleware/verifyToken");
const rateLimit = require("express-rate-limit");
const postRouter = express.Router();

const likeLimiter = rateLimit({
  windowMs: 5 * 1000,
  max: 10,
  message: { message: "Too many requests, please slow down." },
});
const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: "aws-sdk-nestframes",
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
      cb(null, Date.now().toString() + "-" + file.originalname);
    },
  }),
});

async function uploadToMongo(imageMetadata, imageType) {
  const newPhoto = await Photos.create(imageMetadata);
  const user = await Users.findById(imageMetadata.userId);
  if (imageType === "post") {
    user.photos.push(newPhoto._id);
    await user.save();
  } else {
    user.profilePic = newPhoto._id;
    await user.save();
  }
  return newPhoto;
}

async function getImageUrls(userId) {
  const user = await Users.findById(userId).populate({
    path: "posts",
    populate: { path: "photo" },
  });
  const posts = user.posts;
  const photoUrls = [];
  posts.forEach((post) => {
    photoUrls.push(post.photo.fileUrl);
  });
  return photoUrls;
}

postRouter.get("/:userId", async (req, res, next) => {
  const userId = req.params.userId;
  const photos = await getImageUrls(userId);
  if (photos) {
    res.status(200).send(photos);
  } else {
    res.status(400);
  }
});

postRouter.post("/upload", upload.single("file"), async (req, res, next) => {
  try {
    const userId = req.user._id;
    const file = req.file;
    const { albumId, caption, isPublic } = req.body;

    if (!file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    const album = await Albums.findById(albumId);

    if (!album) {
      return res.status(404).json({ message: "Album not found" });
    }
    const imageMetadata = {
      fileUrl: file.location,
      fileName: file.filename,
      userId: userId,
      timestamp: Date.now(),
    };

    const postPhoto = await uploadToMongo(imageMetadata, "post");
    if (!postPhoto) {
      return res.status(500).json({ message: "Error uploading post" });
    }

    const postDetails = {
      photo: postPhoto._id,
      album: albumId,
      caption: caption,
      privacy: isPublic,
      createdBy: userId,
    };

    const createdPost = await Posts.create(postDetails);
    if (!createdPost) {
      return res.status(500).json({ message: "Error uploading post" });
    }
    res.status(200).json({ message: "Post uploaded!" });
  } catch (error) {
    res.status(500).json({ message: "Internal error, try again!" });
  }
});
postRouter.post(
  "/uploadProfilePic",
  upload.single("file"),
  verifyToken,
  async (req, res, next) => {
    try {
      const userId = req.user._id;
      const file = req.file;
      if (!file) {
        return res.status(400).json({ message: "No file uploaded" });
      } else {
        const fileUrl = file.location;
        const imageMetadata = {
          fileUrl: fileUrl,
          filename: file.filename,
          userId: userId,
          timestamp: Date.now(),
        };
        const photo = await uploadToMongo(imageMetadata, "profile");
        res.status(200).json({ message: "File uploaded", photo });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal error, try again!" });
    }
  }
);
postRouter.patch(
  "/:id/like",
  likeLimiter,
  verifyToken,
  async (req, res, next) => {
    try {
      const { id: postId } = req.params;
      const userId = req.user._id;
      const post = await Posts.findById(postId);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      if (
        post.likedBy.some((liker) => liker.toString() === userId.toString())
      ) {
        post.likedBy = post.likedBy.filter(
          (liker) => liker.toString() !== userId.toString()
        );
      } else {
        post.likedBy.push(userId);
      }
      await post.save();
      res.status(200).json({ message: "Post liked!" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal error, try again!" });
    }
  }
);
postRouter.post("/:id/comment", verifyToken, async (req, res, next) => {
  try {
    const { id: postId } = req.params;
    const userId = req.user._id;
    const post = await Posts.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    const {comment:content} = req.body;
    const comment = {
      content: content,
      createdBy: userId,
    };
    post.comments.push(comment);
    await post.save();
    res.status(200).json({ message: "Comment posted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal error, try again!" });
  }
});
postRouter.delete("/:id/comment", verifyToken, async (req, res, next) => {
  try {
    const { id: postId } = req.params;
    const { commentId } = req.body;
    const userId = req.user._id;
    const post = await Posts.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    const comment = post.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }
    if (comment.createdBy.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Unauthorized operation" });
    }
    await Posts.updateOne(
      { _id: postId },
      { $pull: { comments: { _id: commentId } } }
    );
    res.status(200).json({ message: "Comment deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal error, try again!" });
  }
});
postRouter.delete("/:id/delete", verifyToken, async (req, res, next) => {
  try {
    const { id: postId } = req.params;
    const userId = req.user._id;
    const post = await Posts.findById(postId);
    const user = await Users.findById(userId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    if(!user){
      return res.status(404).json({message:"User not found"});
    }
    if (post.postedBy.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Unauthorized operation" });
    }
    user.posts = user.posts.filter((userPost)=>userPost.toString()!==postId.toString());
    await user.save();
    await post.deleteOne();
    res.status(200).json({ message: "Post deleted" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal error, try again!" });
  }
});
module.exports = { postRouter };
