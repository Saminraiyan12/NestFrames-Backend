const express = require("express");
const io = require("socket.io");
const messageRouter = express.Router();
const User = require("../../MongoDB/userModel");
const Conversations = require("../../MongoDB/conversationModel");
const mongoose = require("mongoose");
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

messageRouter.get("/:userId", async (req, res, next) => {
  const { userId } = req.params;
  const userConversations = await Conversations.find({
    $or: [{ user1: userId }, { user2: userId }],
  })
    .populate([
      { path: "user1", populate: { path: "profilePic" } },
      { path: "user2", populate: { path: "profilePic" } },
    ])
    .sort({ lastUpdate: -1 });
  if (userConversations) {
    res.status(200).send(userConversations);
  }
});
messageRouter.get("/:userId/message/:friendId", async (req, res, next) => {
  try {
    const { userId, friendId } = req.params;
    const user = await User.findById(userId);
    const friend = await User.findById(friendId);
    if (!user || !friend) {
      return res
        .status(404)
        .json({ message: "Error retrieving user, try again!" });
    }
    const conversation = await Conversations.findOne({
      $and: [
        { $or: [{ user1: user._id }, { user2: user._id }] },
        { $or: [{ user1: friend._id }, { user2: friend._id }] },
      ],
    });
    if (!conversation) {
      const newConversation = await Conversations.create({
        user1: user._id,
        user2: friend._id,
        messages: [],
      });
      user.conversations.push(newConversation);
      friend.conversations.push(newConversation);
      await user.save();
      await friend.save();
      return res.status(201).json({
        newConversation,
        message: "New conversation created succesfully",
      });
    }
    return res
      .status(200)
      .json({ conversation, message: "Conversation found" });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Error fetching conversation, try again!" });
  }
});
messageRouter.get(
  "/:userUsername/with/:receiverUsername",
  async (req, res, next) => {
    try {
      const { userUsername, receiverUsername } = req.params;
      const conversation = await findConversation(
        userUsername,
        receiverUsername
      );

      if (conversation) {
        res.status(200).send({
          conversation: await conversation.populate([
            { path: "user1", populate: { path: "profilePic" } },
            { path: "user2", populate: { path: "profilePic" } },
          ]),
          convoExists: true,
        });
      } else {
        res.status(200).send({
          conversation: null,
          convoExists: false,
        });
      }
    } catch (error) {
      console.log(error);
    }
  }
);
messageRouter.get("/Conversation/:conversationId", async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const conversation = await Conversations.findById(conversationId).populate([
      { path: "user1", populate: { path: "profilePic" } },
      { path: "user2", populate: { path: "profilePic" } },
    ]);
    res.status(200).send(conversation);
  } catch (error) {
    console.log(error);
  }
});

messageRouter.post("/:id", async (req, res, next) => {
  try {
    const receiverId = req.params.id;
    const { senderId } = req.body;

    const user1 = await User.findById(senderId);
    const user2 = await User.findById(receiverId);

    const conversation = await Conversations.create({
      user1: user1,
      user2: user2,
      messages: [],
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
module.exports = { messageRouter };
