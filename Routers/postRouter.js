const express = require('express');
const Post = require('../MongoDB/postModel');
const postRouter = express.Router();

postRouter.post('/',(req,res,next)=>{ 
  const postBody = req.body;  
  const post = Post.create(postBody);
});

module.exports = {postRouter};


