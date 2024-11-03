const express = require('express');
const Photos = require('../MongoDB/photoModel');
const Users = require('../MongoDB/userModel');
const {S3} = require('@aws-sdk/client-s3');
const s3 = new S3({region:'us-east-2'});
const {Server} = require('socket.io');
const multer = require('multer');
const multerS3 = require('multer-s3');

const photoRouter = express.Router();

const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: 'aws-sdk-nestframes',
    metadata: function (req, file, cb) {
      cb(null, {fieldName: file.fieldname});
    },
    key: function (req, file, cb) {
      cb(null, Date.now().toString() + '-' + file.originalname);
    }
  }),
});

async function uploadToMongo(imageMetadata, imageType){
  const newPhoto = await Photos.create(imageMetadata);
  const user = await Users.findById(imageMetadata.userId);
  if(imageType==='post'){
    user.photos.push(newPhoto._id);
  }
  else{
    user.profilePic = newPhoto._id
  }
  await user.save();
  console.log(newPhoto);
}

async function getImageUrls(userId){
  const user = await Users.findById(userId).populate("photos");
  const photos = user.photos;
  console.log(photos)
  const photoUrls = []
  photos.forEach((photo)=>{
    photoUrls.push(photo.fileUrl)
  })
  return photoUrls;
}

photoRouter.get('/:userId',async(req,res,next)=>{
  const userId = req.params.userId;
  const photos = await getImageUrls(userId);
  if(photos){
    res.status(200).send(photos);
  }
  else{
    res.status(400)
  }
})

photoRouter.post('/upload',upload.single('file'),(req,res,next)=>{ 
  const userId = req.body.userId;
  const file = req.file
  if(!file){
    res.status(400).json({message:'No file uploaded'});
  }
  else{
    const fileUrl = file.location;
    const imageMetadata = {
      fileUrl:fileUrl,
      fileName:file.filename,
      userId:userId,
      timestamp:Date.now()
    }
    uploadToMongo(imageMetadata, 'post');
    res.status(200).json({message:'File uploaded',fileUrl});
  }
});
photoRouter.post('/uploadProfilePic',upload.single('file'),(req,res,next)=>{
  const userId = req.body.userId;
  const file = req.file;
  if(!file){
    res.status(400).json({message:"No file uploaded"});
  }
  else{
    const fileUrl = file.location;
    const imageMetadata = {
      fileUrl:fileUrl,
      filename:file.filename,
      userId:userId,
      timestamp:Date.now()
    };
    uploadToMongo(imageMetadata,'profile');
    res.status(200).json({message:"File uploaded",fileUrl});
   }
})
module.exports = {photoRouter};


