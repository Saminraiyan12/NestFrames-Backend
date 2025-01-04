const express = require("express");
const app = express();
const signinRouter = express.Router();
const User = require("../MongoDB/userModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
signinRouter.post("/", async (req, res, next) => {
  try {
    const userInfo = req.body;
    const user = await User.findOne({ username: userInfo.username }).populate([
      { path: "friendRequestsSent", populate: { path: "profilePic" } },
      { path: "friendRequestsReceived", populate: { path: "profilePic" } },
      { path: "friends", populate: { path: "profilePic" } },
      {
        path: "albums",
        populate: [{ path: "coverPhoto" }, { path: "photos" }],
      },
      {
        path: "albumRequests",
        populate: [{ path: "coverPhoto" }, { path: "users" }],
      },
      "profilePic",
    ]);
    if (!user) {
      return res.status(404).send("User not found");
    }

    const id = user._id;
    const password = user.password;
    const match = await bcrypt.compare(userInfo.password, password);
    if (!match) {
      return res.status(401).json({ message: "Incorrect Password" });
    }
    const accessToken = jwt.sign({ userId: id }, process.env.JWT_SECRET, {
      expiresIn: "15m",
    });
    const refreshToken = jwt.sign({ userId: id }, process.env.JWT_SECRET, {
      expiresIn: "30d",
    });
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      sameSite: "Lax", 
      secure: false, 
      maxAge: 24 * 60 * 60 * 1000, 
      path: "/"
    });
    res.status(200).send({ accessToken, user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal error, try again!" });
  }
});

signinRouter.post("/refresh", (req, res, next) => {
  const { refreshToken } = req.cookies;
  if (!refreshToken) {
    return res.status(401).json({ message: "No refresh token found" });
  }
  jwt.verify(refreshToken, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res
        .status(403)
        .json({ message: "Invalid or expired refresh token" });
    }
    const newAccessToken = jwt.sign(
      { userId: decoded.userId },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );
    res.status(200).json({ accessToken: newAccessToken });
  });
});
signinRouter.post('/logOut', async(req,res,next)=>{
  res.clearCookie('refreshToken',{
    httpOnly:"true",
    sameSite:"Lax",
    secure:false,
    path:'/'
  })
  res.status(200).json({message:"Logged out successfully"});
})
module.exports = { signinRouter };
