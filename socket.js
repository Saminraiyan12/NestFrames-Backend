const socketIO = require("socket.io");

let io;

const setupSocket = (server) => {
  io = socketIO(server, {
    cors: {
      origin: "http://localhost:5173",
    },
  });
  io.on("connection", (socket) => {
    socket.on("registerUser", (userId) => {});
    socket.on("messageSent", async (data) => {
      const user = await User.findById(data.sentBy);
      const receiver = await User.findOne({ username: data.receivedBy });
      const conversation = await Conversations.findOne({
        $or: [
          { user1: user._id, user2: receiver._id },
          { user1: receiver._id, user2: user._id },
        ],
      });
      conversation.lastUpdate = Date.now();
      const message = {
        sentBy: data.sentBy,
        receivedBy: receiver._id.toString(),
        text: data.text,
        createdAt: Date.now(),
      };
      const messages = conversation.messages;
      messages.push(message);
      await conversation.save();
      socket.emit("messageSent", messages[messages.length - 1]);
      socket.broadcast
        .to(conversation._id.toString())
        .emit("messageReceived", messages[messages.length - 1]);
    });
    socket.on("joinRoom", (data) => {
      if (socket.rooms.size === 2) {
        const extraRoom = [...socket.rooms][1];
        socket.rooms.delete(extraRoom);
      }
      socket.join(data._id);
    });
  });
};

module.exports = { setupSocket };
