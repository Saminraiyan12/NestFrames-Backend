const express = require('express');
const userRouter = express.Router();
const User = require('../MongoDB/userModel');

const addFriend = async (sender, receiver) => {
  if (sender.friendRequestsSent.includes(receiver._id)) {
    return false;
  } else {
    sender.friendRequestsSent.push(receiver._id);
    receiver.friendRequestsReceived.push(sender._id);  
    await sender.save();
    await receiver.save();
    return true;
  }
}

userRouter.get('/:username', async (req, res, next) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username }).populate(['friendRequestsSent','friendRequestsReceived','friends']);
    res.status(200).send(user);
  } catch (error) {
    console.log(error);
    res.status(500).send({ error });
  }
})

userRouter.post('/:username/add', async (req, res, next) => {
  try {
    const requestInfo = req.body;
    const { senderId, receiverUsername } = requestInfo;
    const sender = await User.findById(senderId);
    const receiver = await User.findOne({ username: receiverUsername });
    const added = await addFriend(sender, receiver);

    if (added) {
      res.status(201).send(); 
    } else {
      res.status(409).send({ error: "Request Already Sent" });
    }
  } catch (error) {
    res.status(500).send({ error });
  }
})


userRouter.put(`/:userId/accept-request`,async(req,res,next)=>{
  try{
    const {userId} = req.params;
    const {username} = req.body;
    const user = await User.findById(userId);
    const sender = await User.findOne({username});
    const senderId = sender._id;
    const friendRequests = user.friendRequestsReceived;
    let err = true;
    for(let i = 0; i < friendRequests.length;i++){
      if(friendRequests[i].equals(senderId)){
        user.friendRequestsReceived.splice(i, 1);
        user.friends.push(senderId);
        err = false;
      }
    }
    for(let i = 0; i < sender.friendRequestsSent.length;i++){
      if(sender.friendRequestsSent[i].equals(userId)){
        sender.friendRequestsSent.splice(i,1);
        sender.friends.push(userId);
      }
    }
    
    if(!err){
      await Promise.all([sender.save(),user.save()])
      return res.status(200).send((await user.populate(['friendRequestsSent','friendRequestsReceived','friends'])));
    }
    res.status(409).send()
  }
  catch(error){
    console.log(error);
    res.status(500).send({error});
  }

})

module.exports = { userRouter };