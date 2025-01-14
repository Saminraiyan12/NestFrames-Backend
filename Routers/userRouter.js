const express = require("express");
const userRouter = express.Router();
const User = require("../MongoDB/userModel");
const Conversations = require("../MongoDB/conversationModel");

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

userRouter.get("/:username", async (req, res, next) => {
  try {

    const { username } = req.params;
    const user = await User.findOne({ username:username }).populate([
      { path: "friendRequestsSent", populate: { path: "profilePic" } },
      { path: "friendRequestsReceived", populate: { path: "profilePic" } },
      { path: "friends", populate: { path: "profilePic" } },
      {path:"posts",populate:[{path:"photo"},{path:"album"}]},
      {
        path: "albums",
        populate: [{ path: "coverPhoto" }, { path: "posts" }],
      },
      {
        path: "albumRequests",
        populate: [{ path: "coverPhoto" }, { path: "users" }],
      },
      "profilePic",
    ]);
    res.status(200).send(user);
  } catch (error) {
    console.log(error);
    res.status(500).send({ error });
  }
});

userRouter.post("/:username/add", async (req, res, next) => {
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
    res.status(500).send({ error });
  }
});

userRouter.put(`/:userId/accept-request`, async (req, res, next) => {
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
userRouter.get("/:id/suggested-friends", async (req, res, next) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);
    const suggested = await User.find({
      _id: {
        $nin: [
          userId,
          ...user.friends,
          ...user.friendRequestsReceived,
          ...user.friendRequestsSent,
        ],
      },
      friends: { $in: [...user.friends] },
    })
      .limit(20)
      .select("fullname profilePic username friends")
      .populate("profilePic");
    if (!suggested) {
      res
        .status(404)
        .json({ message: "Suggested friends not found, try again!" });
    }
    const suggestedWithMutuals = suggested.map((suggestedUser) => {
      const mutualFriends = user.friends.filter((friend) =>
        suggestedUser.friends.includes(friend._id)
      );
      return {
        user: suggestedUser,
        mutualFriends: mutualFriends.length,
      };
    });
    if (suggestedWithMutuals) {
      res.status(200).json(suggestedWithMutuals);
    }
  } catch (e) {
    console.error(e);
    res
      .status(500)
      .json({ message: "Error fetching suggested friends, try again!" });
  }
});
userRouter.get("/:userId/message/:friendId", async (req, res, next) => {
  try{
    const { userId, friendId } = req.params;
    const user = await User.findById(userId);
    const friend = await User.findById(friendId);
    if (!user || !friend) {
      return res.status(404).json({ message: "Error retrieving user, try again!" });
    }
    const conversation = await Conversations.findOne({
      $and: [
        { $or: [{ user1: user._id }, { user2: user._id }] },
        { $or: [{ user1: friend._id }, { user2: friend._id }] },
      ],
    });
    if(!conversation){
      const newConversation = await Conversations.create({user1:user._id,user2:friend._id,messages:[]});
      user.conversations.push(newConversation);
      friend.conversations.push(newConversation);
      await user.save();
      await friend.save();
      return res.status(201).json({newConversation,message:"New conversation created succesfully"});
    }
    return res.status(200).json({conversation, message:"Conversation found"});
  }
  catch(error){
    console.error(error);
    res
      .status(500)
      .json({ message: "Error fetching conversation, try again!" });
  }
});

module.exports = { userRouter };
