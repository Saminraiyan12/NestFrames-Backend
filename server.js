const mongoose = require("mongoose");
const express = require("express");
const cors = require("cors");
const http = require("http");
const cookieParser = require("cookie-parser");
const { verifyToken } = require("./Middleware/verifyToken.js");
const { Server } = require("socket.io");
const { signinRouter } = require("./Routers/auth/signinRouter.js");
const { registerRouter } = require("./Routers/auth/registerRouter.js");
const { searchRouter } = require("./Routers/utils/searchRouter.js");
const { postRouter } = require("./Routers/media/postRouter.js");
const { userRouter } = require("./Routers/user/userRouter.js");
const { messageRouter } = require("./Routers/messages/messagesRouter.js");
const { albumRouter } = require("./Routers/media/albumRouter.js");
const { notificationRouter } = require('./Routers/utils/notificaionRouter.js')
const connectDB = require("./MongoDB/db.js");
const User = require("./MongoDB/userModel");
const Posts = require('./MongoDB/postModel.js')
const Conversations = require("./MongoDB/conversationModel.js");
const { setupSocket } = require("./socket.js");
const corsOptions = {
  origin: "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  credentials: true,
};
const port = 3002;

const app = express();
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json());
app.use("/Register", registerRouter);
app.use("/Sign-in", signinRouter);
app.use("/search", searchRouter);
app.use("/users", verifyToken, userRouter);
app.use("/Messages", messageRouter);
app.use("/posts", postRouter);
app.use("/Albums", albumRouter);
app.use("/notifications", notificationRouter);
const server = http.createServer(app);

console.log("Poop");

setupSocket(server);

connectDB().then(() => {
  server.listen(port, () => {
    console.log(`connected to port ${port}`);
  });
});
