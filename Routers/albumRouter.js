const mongoose = require('mongoose');
const Albums = require('../MongoDB/albumModel');
const User = require('../MongoDB/userModel');
const express = require('express');

const albumRouter = express.Router();

albumRouter.post('/Create',(req,res,next)=>{
  const album = req.body;
  console.log(album);
})

module.exports = { albumRouter };