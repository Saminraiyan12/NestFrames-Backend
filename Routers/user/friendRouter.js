const express = require('express');
const friendRouter = express.Router();
const User = require('../../MongoDB/userModel');
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
};
friendRouter.post("/:username/add", async (req, res, next) => {
  try {
    const requestInfo = req.body;
    const { senderId, receiverUsername } = requestInfo;
    const sender = await User.findById(senderId);
    const receiver = await User.findOne({ username: receiverUsername });
    if (!sender || !receiver) {
      res.status(404).json({ message: "Error fetching user, try again!" });
    }
    const added = await addFriend(sender, receiver);
    if (!added) {
      res.status(409).send({ message: "Request Already Sent", receiver });
    }
    res.status(201).send({ message: "Friend request sent", receiver });
  } catch (error) {
    console.log(error);
    res.status(500).send({ error });
  }
});
friendRouter.put(`/:userId/accept-request`, async (req, res, next) => {
  try {
    const { userId } = req.params;
    const senderUsername = req.body.username;
    const user = await User.findById(userId);
    const sender = await User.findOne({ username: senderUsername }).populate([
      "profilePic",
    ]);
    if (!user || !sender) {
      res.status(404).send({ message: "User or Sender not found, try again!" });
    }
    user.friendRequestsReceived = user.friendRequestsReceived.filter(
      (request) => String(request._id) !== String(sender._id)
    );
    sender.friendRequestsSent = sender.friendRequestsSent.filter(
      (request) => String(request._id) !== String(user._id)
    );
    if (
      user.friends.some((friend) => String(friend._id) === String(sender._id))
    ) {
      await user.save();
      await sender.save();
      res
        .status(409)
        .json({ message: `${sender.fullname} is already a friend!`, sender });
    } else {
      user.friends.push(sender);
      sender.friends.push(user);
      await user.save();
      await sender.save();
      res
        .status(200)
        .json({ message: `You are now friends with ${sender.full}!`, sender });
    }
  } catch (error) {
    console.log(error);
    res.status(500).send({ error });
  }
});


module.exports = { friendRouter };