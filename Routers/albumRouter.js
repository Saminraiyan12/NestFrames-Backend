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
  try{
    const {albumId} = req.params;
    const album = await Albums.findById(albumId).populate(["coverPhoto", {path: "users", populate:["profilePic"]}, "photos"]);
    if(album){
      res.status(200).send(album);
    }
    else{
      res.status(404).send({error:"Album not found"})
    }
  }
  catch(e){
    res.send(e);
  }
});
albumRouter.post(
  "/Create",
  upload.fields([
    { name: "coverPhoto", maxCount: 1 },
    { name: "photos", maxCount: 10 },
  ]),
  async (req, res, next) => {
    const albumInfo = req.body;
    const { coverPhoto, photos } = req.files;
    const user = await Users.findById(albumInfo.userId);
    const photoArray = [];
    photos.forEach((photo) => {
      const photoUrl = photo.location;
      const imageMetadata = {
        filename: photo.originalname,
        fileUrl: photoUrl,
        userId: albumInfo.userId,
        timestamp: Date.now(),
      };
      photoArray.push(imageMetadata);
    });
    const photoIds = await uploadPhotosToMongo(photoArray);
    const coverUrl = coverPhoto[0].location;
    const coverMetaData = {
      filename: coverPhoto[0].originalname,
      fileUrl: coverUrl,
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
    console.log(album);
    user.albums.push(album._id);
    await user.save();
    res.status(201).send(album._id);
  }
);
albumRouter.patch("/:id/name", async(req,res,next)=>{
  try{
    const newName = req.body.name;
    const albumId = req.params.id;
    const album = await Albums.findById(albumId);
    if (!album) {
      return res.status(404).json({ message: "Album not found" });
    }
    album.name = newName;
    await album.save();
    res.status(200).json({message:"Album name updated succesfully", name:newName});
  }
  catch(error){
    console.error(error);
    res.status(500).json({message:"An error occured while updating the album name"});
  }
})
albumRouter.patch("/:id/collaborators", async(req,res,next)=>{
  const newUserId = req.body.user;
  const albumId = req.params.id;
  const album = await Albums.findById(albumId);
  album.name = newName;
  await album.save();
})

module.exports = { albumRouter };
