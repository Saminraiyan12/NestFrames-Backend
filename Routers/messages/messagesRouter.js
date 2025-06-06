const express = require("express");
const io = require("socket.io");
const messageRouter = express.Router();
const User = require("../../MongoDB/userModel");
const Conversations = require("../../MongoDB/conversationModel");
const Messages = require("../../MongoDB/messageModel");
const mongoose = require("mongoose");
const { verifyToken } = require("../../Middleware/verifyToken");
async function findConversation(senderUsername, receiverUsername) {
  const sender = await User.findOne({ username: senderUsername });
  const receiver = await User.findOne({ username: receiverUsername });
  if (!sender || !receiver) {
    throw new Error("sender or receiver not found");
  }
  const conversation = await Conversations.findOne({
    $or: [
      {
        $and: [{ user1: sender._id }, { user2: receiver._id }],
      },
      {
        $and: [{ user2: sender._id }, { user1: receiver._id }],
      },
    ],
  });
  return conversation;
}

messageRouter.get("/conversations", verifyToken, async (req, res, next) => {
  try {
    const userId = req.user._id;
    const userConversations = await Conversations.find({
      $or: [{ user1: userId }, { user2: userId }],
    })
      .populate([
        { path: "user1", populate: { path: "profilePic" } },
        { path: "user2", populate: { path: "profilePic" } },
      ])
      .sort({ lastUpdate: -1 });
    if (!userConversations) {
      res.status(404).json({ message: "Conversations not found" });
    }
    res.status(200).json({ conversations: userConversations });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal error, try again!" });
  }
});
messageRouter.post(
  "/message/:friendId",
  verifyToken,
  async (req, res, next) => {
    try {
      const userId = req.user._id;
      const { friendId } = req.params;
      const user = await User.findById(userId);
      const friend = await User.findById(friendId);
      if (!user || !friend) {
        return res
          .status(404)
          .json({ message: "Error retrieving user, try again!" });
      }
      let conversation = await Conversations.findOne({
        $and: [
          { $or: [{ user1: user._id }, { user2: user._id }] },
          { $or: [{ user1: friend._id }, { user2: friend._id }] },
        ],
      }).populate([
        {
          path: "user1",
          select: "username fullname, profilePic",
          populate: "profilePic",
        },
        {
          path: "user2",
          select: "username fullname, profilePic",
          populate: "profilePic",
        }
      ]);
      if (!conversation) {
        conversation = await Conversations.create({
          user1: user._id,
          user2: friend._id,
        });
        user.conversations.push(conversation);
        friend.conversations.push(conversation);

        await user.save();
        await friend.save();
        conversation = await conversation.populate([{path:'user1',populate:"profilePic"},{path:"user2",populate:"profilePic"}]);
        return res.status(201).json({
          conversation,
        });
      }
      return res.status(200).json({ conversation });
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ message: "Error fetching conversation, try again!" });
    }
  }
);
messageRouter.get(
  "/conversation/:conversationId",
  verifyToken,
  async (req, res, next) => {
    try {
      const userId = req.user._id.toString();
      const { conversationId } = req.params;
      const conversation = await Conversations.findById(
        conversationId
      ).populate([
        { path: "user1", populate: { path: "profilePic" } },
        { path: "user2", populate: { path: "profilePic" } },
      ]);
      if (
        !(
          conversation.user1._id.toString() === userId ||
          conversation.user2._id.toString() === userId
        )
      ) {
        return res.status(403).json({ message: "Unauthorized operation" });
      }
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }
      res.status(200).json({ conversation });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Internal error, try again!" });
    }
  }
);

messageRouter.post("/:id", async (req, res, next) => {
  try {
    const receiverId = req.params.id;
    const { senderId } = req.body;

    const user1 = await User.findById(senderId);
    const user2 = await User.findById(receiverId);

    const conversation = await Conversations.create({
      user1: user1,
      user2: user2,
    });
    user1.conversations.push(conversation._id);
    user2.conversations.push(conversation._id);
    await user1.save();
    await user2.save();
    res.status(200).send(
      await Conversations.findById(conversation._id).populate([
        { path: "user1", populate: { path: "profilePic" } },
        { path: "user2", populate: { path: "profilePic" } },
      ])
    );
  } catch (error) {
    res.send(error);
  }
});

messageRouter.post("/transmission/:id", async (req, res, next) => {
  try {
    const { receiverUsername, userUsername, message } = req.body;
    if (message) {
      const sender = await User.findOne({ username: userUsername });
      const receiver = await User.findOne({ username: receiverUsername });
      const conversation = await findConversation(
        userUsername,
        receiverUsername
      );

      conversation.messages.push({
        sentBy: sender,
        receivedBy: receiver,
        text: message,
        createdAt: Date.now(),
      });
      await conversation.save();
      res.status(200).send(conversation);
    } else {
      res.status(400).send();
    }
  } catch (error) {
    res.status(500).send(error);
  }
});

messageRouter.get("/:id/getMessages", verifyToken, async(req,res,next)=>{
  try{
    const {id:conversationId} = req.params;
    const userId = req.user._id;
    const conversation = await Conversations.findById(conversationId);
    if(!conversation){
      return res.status(404).json({message:"Conversation not found"});
    }
    if(!(conversation.user1.toString() === userId.toString() || conversation.user2.toString() === userId.toString())){
      return res.status(403).json({message:"Unauthorized access"});
    }
    const messages = await Messages.find({conversation:conversation._id});
    res.status(200).json(messages);
  }
  catch(error){
    res.status(500).json({message:"Internal error, try again!"});
  }
})
module.exports = { messageRouter };
