const socketIO = require("socket.io");
const User = require("./MongoDB/userModel");
const Conversations = require("./MongoDB/conversationModel");
const Notifications = require('./MongoDB/notificationModel');
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
        const user = await User.findById(data.sentBy);
        const receiver = await User.findOne({ username: data.receivedBy });
        if (!user || !receiver) {
          throw new Error("User or receiver not found");
        }
        let conversation = await Conversations.findOne({
          $or: [
            { user1: user._id, user2: receiver._id },
            { user1: receiver._id, user2: user._id },
          ],
        }).populate([{path:'user1', populate:{path:'profilePic'}},{path:'user2',populate:{path:'profilePic'}}]);
        const message = {
          sentBy: data.sentBy,
          receivedBy: receiver._id.toString(),
          text: data.text,
          createdAt: Date.now(),
          read:false
        };
        conversation.lastUpdate = Date.now();
        conversation.messages.push(message);
        await conversation.save();
        if (!conversation) {
         throw new Error("Conversation not found") 
        };
        
        const receiverSocket = users.get(data.receivedBy);
        socket.emit("messageSent", message,conversation);
        if (receiverSocket) {
          io.to(receiverSocket).emit("messageReceived", message,conversation);
        }
        
      } catch (error) {
        console.error("Error handling messageSent event:", error);
        socket.emit("error", { message: error.message });
      }
    });
    socket.on("notification", async(data)=>{
      try{
        const receiver = await User.findOne({username:data.receiverUsername});
        console.log(data.image);
        const notification = {
          receiver:receiver._id,
          sender:data.sender,
          createdAt:data.createdAt,
          message:data.message,
          image:data.image, 
          read:false
        };
        const receiverSocket = users.get(data.receiverUsername);
        if(receiverSocket){
        io.to(receiverSocket).emit("notification",notification);
        }
        await Notifications.create(notification);
      }
      catch(error){
        console.error(error);
      }
      
    })
    socket.on("removeUser", (username) => {
      if (users.has(username)) {
        users.delete(username);
        console.log(`${username} removed from users`);
      }
    });

    socket.on("disconnect", () => {
      const username = [...users.entries()].find(([key, value]) => value === socket.id)?.[0];
      if (username) {
        users.delete(username);
        console.log(`${username} disconnected`);
      }
    });
  });
};

module.exports = { setupSocket };
