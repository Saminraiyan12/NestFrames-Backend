const mongoose = require("mongoose");
const Albums = require("../MongoDB/albumModel");
const Users = require("../MongoDB/userModel");
const Photos = require("../MongoDB/photoModel");
const express = require("express");
const multer = require("multer");
const multerS3 = require("multer-s3");
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
  const user = await Users.findById(imageMetaData.userId);
  const coverPhoto = await Photos.create(imageMetaData);
  user.photos.push(coverPhoto._id);
  return coverPhoto._id;
}

async function uploadPhotosToMongo(imagesMetaData) {
  const user = await Users.findById(imagesMetaData[0].userId);
  const idArray = [];
  for (let i = 0; i < imagesMetaData.length; i++) {
    const newPhoto = await Photos.create(imagesMetaData[i]);
    user.photos.push(newPhoto._id);
    idArray.push(newPhoto._id);
  }

  await user.save();
  return idArray;
}
albumRouter.get("/:albumId", async (req, res, next) => {
  try {
    const { albumId } = req.params;
    const album = await Albums.findById(albumId).populate([
      "coverPhoto",
      { path: "users", populate: ["profilePic"] },
      "photos",
    ]);
    if (album) {
      res.status(200).json(album);
    } else {
      res.status(404).send({ message: "Album not found" });
    }
  } catch (e) {
    res.status(500).json({message:"There was an error in retreiving the album"});
  }
});
albumRouter.post(
  "/Create",
  upload.fields([
    { name: "coverPhoto", maxCount: 1 },
    { name: "photos", maxCount: 10 },
  ]),
  async (req, res, next) => {
    try {
      const albumInfo = req.body;
      if (!albumInfo.userId || !albumInfo.albumName) {
        return res
          .status(400)
          .json({ message: "User ID and album name are required." });
      }
      const { coverPhoto, photos } = req.files;
      if (!coverPhoto || coverPhoto.length === 0) {
        return res.status(400).json({ message: "Cover photo is required." });
      }
      if (!photos || photos.length === 0) {
        return res
          .status(400)
          .json({ message: "At least one photo is required." });
      }
      const user = await Users.findById(albumInfo.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found." });
      }
      const photoArray = [];
      photos.forEach((photo) => {
        photoArray.push({
          filename: photo.originalname,
          fileUrl: photo.location,
          userId: albumInfo.userId,
          timestamp: Date.now(),
        });
      });
      const photoIds = await uploadPhotosToMongo(photoArray);
      const coverMetaData = {
        filename: coverPhoto[0].originalname,
        fileUrl: coverPhoto[0].location,
        userId: albumInfo.userId,
        timestamp: Date.now(),
      };
      const coverId = await uploadCoverToMongo(coverMetaData);
      const albumData = {
        name: albumInfo.albumName,
        users: [albumInfo.userId],
        coverPhoto: coverId,
        photos: photoIds,
      };
      const album = await Albums.create(albumData);
      user.albums.push(album._id);
      await user.save();
      res.status(201).json({ albumId: album._id });
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ message: "An error occured creating the album, try again!" });
    }
  }
);
albumRouter.patch("/:id/name", async (req, res, next) => {
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
albumRouter.patch("/:id/collaborators", async (req, res, next) => {
  try{
    const newUserIds = req.body.userIds;
    const albumId = req.params.id;
    const album = await Albums.findById(albumId);
    let users = [];
    if(!album){
      res.status(400).json({message:"Album not found"});
    }
    const existingUserIds = album.users.map((user) => user.toString());
    const duplicateIds = newUserIds.filter((id) => existingUserIds.includes(id));

    if (duplicateIds.length > 0) {
      return res.status(400).json({ message: "At least one of the selected users is already a collaborator" });
    }
    for (const id of newUserIds) {
      album.users.push(id);
      const user = await Users.findById(id).populate(["profilePic"]);
      user.albumRequests.push(album);
      await user.save();
      users.push(user);
    }
    await album.save();
    res.status(200).json({ message: "Album collaborators added successfully", users });
  }
  catch(error){
    console.error(error);
    res.status(500).json({message:"There was an error updating the album, try again!"});
  }
});
albumRouter.post("/:id/accept-request",async(req,res,next)=>{
  try{
    const albumId = req.params.id;
    const {userId} = req.body;
    const user = await Users.findById(userId);
    if(!user){
      res.status(404).json({message:"There was an issue retrieving your account, please try again!"});
    }
    if(user.albums.find((album)=>{album._id===albumId})){
      res.status(400).json({message:"User is already a collaborator!"})
    }
    user.albumRequests = user.albumRequests.filter((request)=> request._id.toString()!==albumId);
    user.albums.push(albumId);
    await user.save();
    const album = await Albums.findById(albumId).populate(["coverPhoto", "photos"]);
    console.log(album)
    res.status(200).json({message:"Album request accepted!", album});
  }
  catch(error){
    res.status(500).json({message:"There was an error accepting the request, try again!"})
  }

})
albumRouter.post("/:id/decline-request", async(req,res,next)=>{
  try{
    const albumId = req.params.id;
    const {userId} = req.body;
    const user = await Users.findById(userId);
    if(!user){
      res.status(404).json({message:"There was an issue retrieving your account, please try again!"});
    }
    user.albumRequests = user.albumRequests.filter((request)=> request._id.toString()!==albumId);
    await user.save();
    res.status(200).json({message:"Album request decline!", albumId});
  }
  catch(error){
    res.status(500).json({message:"There was an error accepting the request, try again!"});
  }
})

module.exports = { albumRouter };
