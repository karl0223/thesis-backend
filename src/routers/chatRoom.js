// Import the necessary dependencies
const express = require("express");
const router = express.Router();
const Chatroom = require("../models/chatRoom");
const chatroomController = require("../controllers/chatroomController");

// Import Socket.IO and create a new instance
const socketio = require("socket.io");
const http = require("http");
const server = http.createServer(router);
const io = socketio(server);

// Define a function to emit the updated chatroom to all connected clients
const emitChatroomUpdate = (chatroomId) => {
  Chatroom.findById(chatroomId)
    .populate("participants")
    .exec((err, chatroom) => {
      if (err || !chatroom) {
        console.error(err);
        return;
      }
      io.to(chatroomId).emit("chatroomUpdated", chatroom);
    });
};
-(
  // Define Socket.IO event listeners
  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Join a chatroom
    socket.on("joinChatroom", (chatroomId) => {
      socket.join(chatroomId);
      console.log(`Socket ${socket.id} joined chatroom ${chatroomId}`);
    });

    // Leave a chatroom
    socket.on("leaveChatroom", (chatroomId) => {
      socket.leave(chatroomId);
      console.log(`Socket ${socket.id} left chatroom ${chatroomId}`);
    });

    // Create a message in a chatroom
    socket.on("createMessage", (data) => {
      const { chatroomId, sender, content } = data;
      const message = {
        sender,
        content,
      };
      Chatroom.findById(chatroomId, (err, chatroom) => {
        if (err || !chatroom) {
          console.error(err);
          return;
        }
        chatroom.messages.push(message);
        chatroom.save((err) => {
          if (err) {
            console.error(err);
            return;
          }
          emitChatroomUpdate(chatroomId);
        });
      });
    });

    // Disconnect the socket
    socket.on("disconnect", () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  })
);

// Define the routes
router.get("/", chatroomController.getAllChatrooms);
router.post("/", chatroomController.createChatroom);
router.get("/:chatroomId", chatroomController.getChatroomById);

// Create a message in a chatroom
router.post("/:chatroomId/message", (req, res) => {
  const { chatroomId } = req.params;
  const { sender, content } = req.body;

  if (!chatroomId || !sender || !content) {
    return res.status(400).json({ msg: "Missing required field(s)" });
  }

  // Create a new message object
  const message = {
    sender,
    content,
  };

  // Find the chatroom by ID and add the message to its messages array
  Chatroom.findById(chatroomId, (err, chatroom) => {
    if (err || !chatroom) {
      console.error(err);
      return res.status(404).json({ msg: "Chatroom not found" });
    }

    chatroom.messages.push(message);
    chatroom.save((err) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Server Error");
      }

      // Emit the updated chatroom to all connected clients
      emitChatroomUpdate(chatroomId);

      return res.json(chatroom);
    });
  });
});

// Export the router and the Socket.IO instance
module.exports = { router, io };
