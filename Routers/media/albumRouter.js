const mongoose = require("mongoose");
const Albums = require("../../MongoDB/albumModel");
const { verifyToken } = require("../../Middleware/verifyToken");
const Users = require("../../MongoDB/userModel");
const Photos = require("../../MongoDB/photoModel");
const Posts = require("../../MongoDB/postModel");
const express = require("express");
const multer = require("multer");
const multerS3 = require("multer-s3");
const rateLimit = require("express-rate-limit")
const albumRouter = express.Router();
const { S3 } = require("@aws-sdk/client-s3");
const s3 = new S3({ region: "us-east-2" });
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
async function uploadCoverToMongo(imageMetaData) {
  const coverPhoto = await Photos.create(imageMetaData);
  return coverPhoto._id;
}
const likeLimiter = rateLimit({
  windowMs: 5 * 1000, 
  max: 5, 
  message: { message: "Too many requests, please slow down." }
});
async function uploadPhotosToMongo(imagesMetaData) {
  const idArray = [];
  for (let i = 0; i < imagesMetaData.length; i++) {
    const newPhoto = await Photos.create(imagesMetaData[i]);
    idArray.push(newPhoto._id);
  }
  return idArray;
}
async function createPosts(PostData) {
  const user = await Users.findById(PostData[0].postedBy);
  const postArray = [];
  for (let i = 0; i < PostData.length; i++) {
    const newPost = await Posts.create(PostData[i]);
    postArray.push(newPost);
    user.posts.push(newPost);
  }
  await user.save();
  return postArray;
}
async function getUsers(users) {
  const userPromises = users.map(async (id) => {
    return await Users.findById(id);
  });
  return await Promise.all(userPromises);
}

async function pushAlbumToUsers(userIds, albumId) {
  for (let i = 0; i < userIds.length; i++) {
    const user = await Users.findById(userIds[i]);
    user.albums.push(albumId);
    await user.save();
  }
}
albumRouter.get("/get/popular", async (req, res, next) => {
  try {
    const albums = await Albums.find()
      .sort({ views: -1 })
      .limit(6)
      .populate(["coverPhoto"]);
    if (albums) {
      res.status(200).json({ albums: albums });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal error, try again!" });
  }
});
albumRouter.get("/:albumId", async (req, res, next) => {
  try {
    const { albumId } = req.params;
    const album = await Albums.findById(albumId).populate([
      "coverPhoto",
      { path: "users", populate: { path: "profilePic" } },
      { path: "posts", populate: { path: "photo" } },
    ]);
    if (!album) {
      res.status(404).json({ message: "Album not found" });
    }
    album.views = (album.views || 0) + 1;
    await album.save();
    res.status(200).json(album);
  } catch (e) {
    console.error(`Error retrieving album: ${e}`);
    res
      .status(500)
      .json({ message: "There was an error in retreiving the album" });
  }
});
albumRouter.post(
  "/Create",
  verifyToken,
  upload.fields([
    { name: "coverPhoto", maxCount: 1 },
    { name: "photos", maxCount: 10 },
  ]),
  async (req, res) => {
    try {
      const { name, users, posts } = req.body;
      const { coverPhoto, photos } = req.files;

      if (!users?.length || !name || !coverPhoto || !photos?.length) {
        return res.status(400).json({ message: "Missing required fields." });
      }

      const collaborators = await getUsers(users);
      if (!collaborators) {
        return res.status(404).json({ message: "Users not found." });
      }
      const creator = collaborators[0];
      const photoMeta = photos.map((file) => ({
        filename: file.originalname,
        fileUrl: file.location,
        userId: creator._id,
        timestamp: Date.now(),
      }));

      const photoIds = await uploadPhotosToMongo(photoMeta);

      const coverMeta = {
        filename: coverPhoto[0].originalname,
        fileUrl: coverPhoto[0].location,
        userId: creator._id,
        timestamp: Date.now(),
      };
      const coverId = await uploadCoverToMongo(coverMeta);

      const postData = posts.map((post, index) => ({
        ...JSON.parse(post),
        photo: photoIds[index],
      }));
      const createdPosts = await createPosts(postData);

      const album = await Albums.create({
        name,
        users: collaborators[0],
        coverPhoto: coverId,
        posts: createdPosts,
        likes: 0,
        views: 0,
      });
      collaborators[0].albums.push(album._id);
      await collaborators[0].save();
      for (let i = 1; i < collaborators.length; i++) {
        const user = collaborators[i];
        user.albumRequests.push(album._id);
        await user.save();
      }
      for (let i = 0; i < createdPosts.length; i++) {
        const post = createdPosts[i];
        post.album = album._id;
        await post.save();
      }
      res.status(201).json({ albumId: album._id });
    } catch (error) {
      console.error("Error creating album:", error);
      res.status(500).json({ message: "Error creating album." });
    }
  }
);

albumRouter.patch("/:id/name", verifyToken, async (req, res, next) => {
  try {
    const newName = req.body.name;
    const albumId = req.params.id;
    const album = await Albums.findById(albumId);
    if (!album) {
      return res.status(404).json({ message: "Album not found" });
    }
    album.name = newName;
    await album.save();
    res
      .status(200)
      .json({ message: "Album name updated succesfully", name: newName });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "An error occured while updating the album name" });
  }
});
albumRouter.patch(
  "/:id/invite-collaborators",
  verifyToken,
  async (req, res, next) => {
    try {
      const newUserIds = req.body.userIds;
      const albumId = req.params.id;
      const album = await Albums.findById(albumId);
      if (!album) {
        return res.status(400).json({ message: "Error retrieving album" });
      }
      for (const id of newUserIds) {
        const user = await Users.findById(id);
        if (
          !user.albumRequests.includes(album._id) &&
          !album.users.includes(user._id)
        ) {
          user.albumRequests.push(album);
          await user.save();
        }
      }
      res.status(200).json({ message: "Collaboration request sent!" });
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ message: "There was an error updating the album" });
    }
  }
);
albumRouter.patch(
  "/:id/accept-invitation",
  verifyToken,
  async (req, res, next) => {
    try {
      const albumId = req.params.id;
      const { userId } = req.body;
      const user = await Users.findById(userId);
      if (!user) {
        return res.status(404).json({
          message: "There was an issue retrieving your account",
        });
      }
      user.albumRequests = user.albumRequests.filter(
        (request) => request._id.toString() !== albumId
      );
      if (
        user.albums.find((album) => {
          album._id === albumId;
        })
      ) {
        await user.save();
        return res
          .status(400)
          .json({ message: "User is already a collaborator!" });
      }
      user.albums.push(albumId);
      await user.save();
      const album = await Albums.findById(albumId).populate(["coverPhoto"]);
      album.users.push(user);
      await album.save();
      res.status(200).json({ message: "Album request accepted!", album });
    } catch (error) {
      res.status(500).json({
        message: "There was an error accepting the request, try again!",
      });
    }
  }
);
albumRouter.patch(
  "/:id/decline-invitation",
  verifyToken,
  async (req, res, next) => {
    try {
      const albumId = req.params.id;
      const { userId } = req.body;
      const user = await Users.findById(userId);
      if (!user) {
        res.status(404).json({
          message: "There was an issue retrieving your account",
        });
      }
      user.albumRequests = user.albumRequests.filter(
        (request) => request._id.toString() !== albumId
      );
      await user.save();
      res.status(200).json({ message: "Album request declined!", albumId });
    } catch (error) {
      res.status(500).json({
        message: "There was an error accepting the request, try again!",
      });
    }
  }
);

albumRouter.patch("/:id/like", likeLimiter, verifyToken, async (req, res, next) => {
  try {
    const { id: albumId } = req.params;
    const { userId } = req.body;
    const user = await Users.findById(userId);
    const album = await Albums.findById(albumId);
    if (!user || !album) {
      return res.status(404).json({ message: "Error retrieving data" });
    }
    if (!album.likedBy.includes(user._id)) {
      album.likedBy.push(user._id);
      await album.save();
      return res.status(201).json({ message: "Succesfully liked album", user });
    } else {
      album.likedBy = album.likedBy.filter(
        (liker) => liker.toString() !== user._id.toString()
      );
      await album.save();
      return res.status(200).json({message:"Succesfully unliked album", user});
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal error, try again!" });
  }
});
module.exports = { albumRouter };
