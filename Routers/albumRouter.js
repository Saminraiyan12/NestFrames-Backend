const mongoose = require("mongoose");
const Albums = require("../MongoDB/albumModel");
const Users = require("../MongoDB/userModel");
const Photos = require('../MongoDB/photoModel');
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
async function uploadCoverToMongo(imageMetaData){
  const coverPhoto = await Photos.create(imageMetaData);
  return coverPhoto._id;
}

















async function uploadPhotosToMongo(imagesMetadata) {
  const user = await Users.findById(imagesMetadata[0].userId);
  const idArray = []
  for(let i = 0;i<imagesMetadata.length;i++){
    const newPhoto = await Photos.create(imagesMetadata[i]);
    user.photos.push(newPhoto._id);
    idArray.push(newPhoto._id);
  }
  await user.save();
  return idArray;
}

albumRouter.post(
  "/Create",
  upload.fields([
    { name: "coverPhoto", maxCount: 1 },
    { name: "photos", maxCount: 10 },
  ]),
  async (req, res, next) => {
    const albumInfo = req.body;
    const {coverPhoto, photos}= req.files;
    const photoArray = [];
    photos.forEach(photo => {
      const photoUrl = photo.location;
      const imageMetadata = {
        filename:photo.originalname,
        fileUrl:photoUrl,
        userId:albumInfo.userId, 
        timestamp:Date.now(),
      }
      photoArray.push(imageMetadata);
    });
    const photoIds = await uploadPhotosToMongo(photoArray);
    const coverMetaData = {
      filename:coverPhoto.filename,
      fileUrl:coverPhoto.location,
      userId:albumInfo.userId,
      timestamp:Date.now()
    }
    const coverId = await uploadCoverToMongo(coverMetaData);
    const albumData = {
      name: albumInfo.albumName,
      users:[],
      coverPhoto:coverId,
      photos:photoIds
    };
    console.log(albumData);
  }
);

module.exports = { albumRouter };
