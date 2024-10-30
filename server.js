const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');
const http = require('http');
const {Server} = require('socket.io');
const {signinRouter} = require('./Routers/signinRouter.js');
const{registerRouter} = require('./Routers/registerRouter.js');
const {searchRouter} = require('./Routers/searchRouter.js');  
const {postRouter} = require('./Routers/postRouter.js');
const {userRouter} = require('./Routers/userRouter.js');
const {messageRouter} = require('./Routers/messagesRouter.js');
const connectDB = require('./MongoDB/db.js');
const User = require("./MongoDB/userModel");
const Conversations = require("./MongoDB/conversationModel.js");
const corsOptions = {
  origin: "http://localhost:5173",
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
};
const port = 3002;

const app = express();
app.use(cors(corsOptions));
app.use(express.json())
app.use('/Register', registerRouter);
app.use('/Sign-in', signinRouter);
app.use('/search', searchRouter);
app.use('/users', userRouter);
app.use('/Messages',messageRouter);

const server = http.createServer(app);
const io = new Server(server,{
  cors:{
    origin: 'http://localhost:5173'
  }
})
const socketConnections = [];
console.log("Doop");
io.on('connection',(socket)=>{
  socket.on("registerUser",(userId)=>{
      
  })
  socket.on('messageSent',async(data)=>{
    const user = await User.findById(data.sentBy);
    const receiver = await User.findOne({username:data.receivedBy});
    const conversation = await Conversations.findOne({$or:[{user1:user._id, user2:receiver._id},{user1:receiver._id,user2:user._id}]});
    const message = {
      sentBy: data.sentBy,
      receivedBy: receiver._id.toString(),
      text: data.text,
      createdAt: Date.now(),
    }
    const messages = conversation.messages;
    messages.push(message);
    await conversation.save();
    console.log(messages[messages.length-1]);
    socket.emit('messageSent',messages[messages.length-1]);
    socket.broadcast.to(conversation._id.toString()).emit('messageReceived',messages[messages.length-1])
  })
  socket.on('joinRoom',(data)=>{
    if(socket.rooms.size===2){
      const extraRoom = [...socket.rooms][1];
      socket.rooms.delete(extraRoom);
    }
    socket.join(data._id);
  })
})



connectDB().then(()=>{
  server.listen(port,()=>{
    console.log(`connected to port ${port}`)
  })
})


