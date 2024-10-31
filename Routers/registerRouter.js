const express = require('express');
const User = require('../MongoDB/userModel');
const registerRouter = express.Router();
const bcrypt = require('bcryptjs')

registerRouter.post('/',async(req,res,next)=>{
  try{
    const newUserInfo = req.body;
    if(!((await User.find({username:newUserInfo.username})).length>0)){
      const password = newUserInfo.password;
      const newPassword = await bcrypt.hash(password,10);
      console.log(newPassword);
      newUserInfo.password = newPassword;
      console.log(newUserInfo);
      const user = await User.create(newUserInfo);
      res.status(201).send(user);
    }
    else{
      throw new Error('User already exists')
    }
  }
  catch(error){
    console.log(error);
    res.status(409).send(error);
  }
 
})

module.exports = {registerRouter};