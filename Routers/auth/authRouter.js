const express = require("express");
const app = express();
const authRouter = express.Router();
const User = require("../../MongoDB/userModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
authRouter.post("/login", async (req, res, next) => {
  try {
    const userInfo = req.body;
    const user = await User.findOne({ username: userInfo.username }).populate([
      { path: "friendRequestsSent", populate: { path: "profilePic" } },
      { path: "friendRequestsReceived", populate: { path: "profilePic" } },
      { path: "friends", populate: { path: "profilePic" } },
      { path: "posts", populate: [{ path: "photo" }, { path: "album" }] },
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
    if (!user) {
      return res.status(404).send("User not found");
    }

    const password = user.password;
    const match = await bcrypt.compare(userInfo.password, password);
    if (!match) {
      return res.status(401).json({ message: "Incorrect Password" });
    }
    const accessToken = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "15m",
    });
    const refreshToken = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "30d",
    });
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      sameSite: "Lax",
      secure: false,
      maxAge: 24 * 60 * 60 * 1000,
      path: "/",
    });
    res.status(200).send({ accessToken, user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal error, try again!" });
  }
});

authRouter.post("/refresh", (req, res, next) => {
  try {
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
        { _id: decoded._id },
        process.env.JWT_SECRET,
        { expiresIn: "15m" }
      );
      res.status(200).json({ accessToken: newAccessToken });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error trying to refresh token" });
  }
});
authRouter.post("/logOut", async (req, res, next) => {
  try {
    res.clearCookie("refreshToken", {
      httpOnly: "true",
      sameSite: "Lax",
      secure: false,
      path: "/",
    });
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({ message: "Internal error, try again!" });
  }
});
authRouter.post("/register", async (req, res, next) => {
  try {
    const newUserInfo = req.body;
    if ((await User.find({ username: newUserInfo.username }).length) > 0) {
      return res.status(400).json({ message: "Username already in use!" });
    }
    const password = newUserInfo.password;
    const newPassword = await bcrypt.hash(password, 10);
    newUserInfo.password = newPassword;
    await User.create(newUserInfo);
    res.status(201).json({ message: "Account created succesfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal error, try again!" });
  }
});
module.exports = { authRouter };
