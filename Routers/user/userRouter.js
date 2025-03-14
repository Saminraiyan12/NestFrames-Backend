const express = require("express");
const userRouter = express.Router();
const User = require("../../MongoDB/userModel");
const Posts = require("../../MongoDB/postModel");

userRouter.get("/:username", async (req, res, next) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username: username }).populate([
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
    res.status(200).send(user);
  } catch (error) {
    console.log(error);
    res.status(500).send({ error });
  }
});

userRouter.get("/:id/suggested-friends", async (req, res, next) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);
    const suggested = await User.find({
      _id: {
        $nin: [
          userId,
          ...user.friends,
          ...user.friendRequestsReceived,
          ...user.friendRequestsSent,
        ],
      },
      friends: { $in: [...user.friends] },
    })
      .limit(20)
      .select("fullname profilePic username friends")
      .populate("profilePic");
    if (!suggested) {
      res
        .status(404)
        .json({ message: "Suggested friends not found, try again!" });
    }
    const suggestedWithMutuals = suggested.map((suggestedUser) => {
      const mutualFriends = user.friends.filter((friend) =>
        suggestedUser.friends.includes(friend._id)
      );
      return {
        user: suggestedUser,
        mutualFriends: mutualFriends.length,
      };
    });
    if (suggestedWithMutuals) {
      res.status(200).json(suggestedWithMutuals);
    }
  } catch (e) {
    console.error(e);
    res
      .status(500)
      .json({ message: "Error fetching suggested friends, try again!" });
  }
});

userRouter.get("/:username/getPosts", async (req, res, next) => {
  try {
    const { username } = req.params;
    const { skip, limit } = req.query;
    const user = await User.findOne({ username: username });
    if (!user) {
      res.status(400).json({ message: "Error retreiving user, try again!" });
    }
    const posts = await Posts.find({
      $or: [{ privacy: false }, { postedBy: { $in: user.friends } }],
    })
      .skip(parseInt(skip))
      .limit(parseInt(limit) + 1)
      .populate([
        "photo",
        { path: "postedBy", populate: { path: "profilePic" } },
      ])
      .exec();
    if (!posts) {
      res.status(400).json({ message: "Error retreiving posts, try again!" });
    }

    const hasMore = posts.length > limit;
    if (hasMore) {
      posts.pop();
    }
    res.status(200).json({ posts, hasMore });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error });
  }
});
userRouter.get("/:id/findFriends", async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).populate("friends", "_id");
    if (!user) {
      res.status(400).json({ message: "Error retrieiving user, try again!" });
    }
    const excludedIds = [
      id,
      ...user.friends.map((friend) => friend._id),
      ...user.friendRequestsReceived.map((friend) => friend._id),
      ...user.friendRequestsSent.map((friend) => friend._id),
    ];
    const friends = await User.find({
      _id: { $nin: excludedIds },
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      profilePic: { $exists: true },
    })
      .limit(10)
      .sort({ createdAt: -1 })
      .populate(["profilePic"]);
    if (!friends) {
      res
        .status(400)
        .json({ message: "Error retrieiving suggested friends, try again!" });
    }
    res.status(200).json({ friends: friends });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal error, try again!" });
  }
});

module.exports = { userRouter };
