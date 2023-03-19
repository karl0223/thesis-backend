// controllers/chatController.js

const ChatRoom = require("../models/chatRoom");
const User = require("../models/user");

const getAllChats = async (req, res) => {
  try {
    const userId = req.user._id; // assuming authentication middleware is used to set req.user
    const chats = await ChatRoom.find({ participants: userId })
      .populate({
        path: "participants",
        select: "_id name",
      })
      .select("-logs")
      .exec();
    res.json(chats);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
};

const createChat = async (req, res) => {
  try {
    const { userId1, userId2 } = req.body;
    const participants = [userId1, userId2];
    const existingChat = await ChatRoom.findOne({
      participants: { $all: participants },
    });
    if (existingChat) {
      return res.status(400).send("Chat already exists");
    }
    const chat = new ChatRoom({ participants });
    await chat.save();
    res.json(chat);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
};

const createMessage = async (req, res) => {
  try {
    const userId = req.user._id; // assuming authentication middleware is used to set req.user
    const { chatId } = req.params;
    const { message } = req.body;
    const chat = await ChatRoom.findById(chatId);
    if (!chat) {
      return res.status(404).send("Chat not found");
    }
    if (!chat.participants.includes(userId)) {
      return res.status(403).send("Not authorized");
    }
    const log = {
      senderId: userId,
      message,
    };
    chat.logs.push(log);
    await chat.save();
    res.json(log);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
};

const addFriend = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { friendId } = req.body;
    const chat = await ChatRoom.findById(chatId);
    if (!chat) {
      return res.status(404).send("Chat not found");
    }
    const friend = await User.findById(friendId);
    if (!friend) {
      return res.status(404).send("Friend not found");
    }
    if (chat.participants.includes(friendId)) {
      return res.status(400).send("Friend already in chat");
    }
    chat.participants.push(friendId);
    await chat.save();
    res.json(chat);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
};

module.exports = {
  getAllChats,
  createChat,
  createMessage,
  addFriend,
};
