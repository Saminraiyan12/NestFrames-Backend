const socketIO = require("socket.io");
const User = require("./MongoDB/userModel");
const Conversations = require("./MongoDB/conversationModel");
const Notifications = require("./MongoDB/notificationModel");
const Messages = require("./MongoDB/messageModel");
let io;
const users = new Map();

const setupSocket = (server) => {
  io = socketIO(server, {
    cors: {
      origin: "http://localhost:5173", // Update this for production
    },
  });

  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    socket.on("registerUser", (username) => {
      users.set(username, socket.id);
      console.log(`${username} registered with socket ID: ${socket.id}`);
    });

    socket.on("messageSent", async (data) => {
      try {
        const receiver = await User.findById(data.receivedBy);
        if (!receiver) {
          throw new Error("User or receiver not found");
        }
        
        const message = await Messages.create(data);
        await Conversations.findByIdAndUpdate(data.conversation, {
          lastUpdate: Date.now(),
          lastMessage: message._id,
        });
        const updatedConversation = await Conversations.findById(data.conversation).populate([
          { path: "user1", populate: "profilePic" },
          { path: "user2", populate: "profilePic" },
          { path: "lastMessage" },
        ]);
        if (!updatedConversation) {
          throw new Error("Conversation not found");
        }
        const receiverSocket = users.get(receiver.username);
        socket.emit("messageSent", message, updatedConversation);
        if (receiverSocket) {
          io.to(receiverSocket).emit("messageReceived", message, updatedConversation);
        }
      } catch (error) {
        console.error("Error handling messageSent event:", error);
        socket.emit("error", { message: error.message });
      }
    });
    socket.on("read", async (data) => {
      try {
        const { conversation: conversationReceived } = data;
        const conversation = await Conversations.findById(
          conversationReceived._id
        );
        const message = await Messages.findById(conversation.lastMessage._id);
        if (!conversation) {
          throw new Error("Conversation not found");
        }
        conversation.lastMessage.read = true;
        message.read = true;
        await message.save();
        await conversation.save();
      } catch (error) {
        console.error(error);
      }
    });
    socket.on("notification", async (data) => {
      try {
        const receiver = await User.findOne({
          username: data.receiverUsername,
        });
        console.log(data.image);
        const notification = {
          receiver: receiver._id,
          sender: data.sender,
          createdAt: data.createdAt,
          message: data.message,
          image: data.image,
          read: false,
        };
        const receiverSocket = users.get(data.receiverUsername);
        if (receiverSocket) {
          io.to(receiverSocket).emit("notification", notification);
        }
        await Notifications.create(notification);
      } catch (error) {
        console.error(error);
      }
    });

    socket.on("removeUser", (username) => {
      if (users.has(username)) {
        users.delete(username);
        console.log(`${username} removed from users`);
      }
    });

    socket.on("disconnect", () => {
      const username = [...users.entries()].find(
        ([key, value]) => value === socket.id
      )?.[0];
      if (username) {
        users.delete(username);
        console.log(`${username} disconnected`);
      }
    });
  });
};

module.exports = { setupSocket };
