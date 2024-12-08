const express = require("express");
const app = express();
const signinRouter = express.Router();
const User = require("../MongoDB/userModel");
const bcrypt = require("bcryptjs");
const findIdByUsername = async (username) => {
  const id = await User.findOne({ username: username });
  return id;
};
signinRouter.post("/", async (req, res, next) => {
  const userInfo = req.body;
  let id = await findIdByUsername(userInfo.username);
  if (id) {
    id = id._id;
    const user = await User.findById(id).populate([
      { path: "friendRequestsSent", populate: { path: "profilePic" } },
      { path: "friendRequestsReceived", populate: { path: "profilePic" } },
      { path: "friends", populate: { path: "profilePic" } },
      {
        path: "albums",
        populate: [{ path: "coverPhoto" }, { path: "photos" }],
      },
      "profilePic",
    ]);
    const password = (await User.findById(id)).password;
    bcrypt.compare(userInfo.password, password, function (err, result) {
      if (result) {
        res.status(200).send(user);
      } else {
        res.status(401).json({ message: "Incorrect Password" });
      }
    });
  } else {
    res.status(404).send("User not found");
  }
});

module.exports = { signinRouter };
