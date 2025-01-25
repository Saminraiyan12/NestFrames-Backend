const express = require('express');
const notificationRouter = express.Router();
const Notifications = require('../../MongoDB/notificationModel');
const mongoose = require('mongoose');

notificationRouter.get("/:userId/getNotifications", async (req, res, next) => {
  try {
    console.log('getting notifications');
    const { userId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    const notifications = await Notifications.find({
      receiver: userId,
    }).limit(20).sort({ createdAt: -1, read: 1 }).populate("sender", "username fullname profilePic");
    if (!notifications) {
      res
        .status(404)
        .json({ message: "Error getting notifications, try again!" });
    }
    console.log(notifications);
    res.status(200).json({ notifications });
  } 
  catch (error) {
    console.error(error);
    res.status(500).json({message:"Internal error, try again!"});
  }
});
module.exports = {notificationRouter};