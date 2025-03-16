const express = require("express");
const friendRouter = express.Router();
const User = require("../../MongoDB/userModel");
const addFriend = async (sender, receiver) => {
  if (sender.friendRequestsSent.some((req) => req.toString() === receiver._id.toString())) {
    return false;
  }
  sender.friendRequestsSent.push(receiver._id);
  receiver.friendRequestsReceived.push(sender._id);
  await Promise.all([sender.save(),receiver.save()]);
  return true;
};
friendRouter.post("/:username/add", async (req, res, next) => {
  try {
    const { username: receiverUsername } = req.params;
    const { userUsername } = req.body;
    const user = await User.findOne({ username: userUsername });
    const receiver = await User.findOne({ username: receiverUsername });
    if (!user || !receiver) {
      return res.status(404).json({ message: "User not found" });
    }
    const added = await addFriend(user, receiver);
    if (!added) {
      return res
        .status(409)
        .send({ message: "Request Already Sent", receiver });
    }
    res.status(201).send({ message: "Friend request sent", receiver });
  } catch (error) {
    console.log(error);
    res.status(500).send({ error });
  }
});
friendRouter.put(`/:username/accept-request`, async (req, res, next) => {
  try {
    const { username: senderUsername } = req.params;
    const { userUsername } = req.body;
    const user = await User.findOne({ username: userUsername });
    const sender = await User.findOne({ username: senderUsername }).populate([
      "profilePic"
    ]);
    if (!user || !sender) {
      return res
        .status(404)
        .json({ message: "User or Sender not found, try again!" });
    }
    user.friendRequestsReceived = user.friendRequestsReceived.filter(
      (request) =>  request._id.toString() !== sender._id.toString()
    );
    sender.friendRequestsSent = sender.friendRequestsSent.filter(
      (request) => request._id.toString() !== user._id.toString()
    );
    if (user.friends.some((friend) => friend._id.toString() === sender._id.toString())) {
      await Promise.all([user.save(), sender.save()]);
      return res
        .status(400)
        .json({ message: `${sender.fullname} is already a friend!`, sender });
    }
    user.friends.push(sender);
    sender.friends.push(user);
    await Promise.all([user.save(), sender.save()]);
    res.status(200).json({
      message: `You are now friends with ${sender.fullname}!`,
      sender,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({ error });
  }
});

friendRouter.put("/:username/ignore-request", async (req, res, next) => {
  try {
    const { username } = req.params;
    const { userUsername } = req.body;
    const reqSender = await User.findOne({ username: username });
    const reqReceiver = await User.findOne({ username: userUsername });
    if (!reqSender || !reqReceiver) {
      res.status(404).json({ message: "User not found" });
    }
    reqReceiver.friendRequestsReceived =
      reqReceiver.friendRequestsReceived.filter(
        (req) => req._id.toString() !== reqSender._id.toString()
      );
    reqSender.friendRequestsSent = reqSender.friendRequestsSent.filter(
      (req) => req._id.toString() !== reqReceiver._id.toString()
    );
    await Promise.all([reqSender.save(), reqReceiver.save()]);
    res.status(204).send();
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error });
  }
});

module.exports = { friendRouter };
