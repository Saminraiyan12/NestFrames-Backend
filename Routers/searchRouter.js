const express = require('express');
const searchRouter = express.Router();
const User = require('../MongoDB/userModel');
searchRouter.get('/', async(req,res,next)=>{
  try{
    const {searchQuery} = req.query;
    const response = await User.find(
      {username:{$regex:RegExp(searchQuery,'i') }
    }).populate(["profilePic"]).limit(10);
    if(response.length>0){
      res.status(200).send(response);
    }
    else{
      res.status(404).send('No users found');
    }
  }
  catch(error){
    res.status(500).send('Server Error');
  }
})
module.exports = {searchRouter};