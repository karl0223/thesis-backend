const app = require("./app");
// const ChatRoom = require("../models/chatRoom");
// const User = require("../models/user");

const port = process.env.PORT;

// // Import Socket.IO and create a new instance
// const socketio = require("socket.io");
// const http = require("http");
// const server = http.createServer(app);
// const io = socketio(server);

// // Define Socket.IO event listeners
// io.on("connection", (socket) => {
//   console.log(`Socket connected: ${socket.id}`);

//   // Join a chatroom
//   socket.on("joinChatroom", async (data) => {
//     const { chatroomId } = data;
//     socket.join(chatroomId);
//     console.log(`Socket ${socket.id} joined chatroom ${chatroomId}`);
//   });

//   // Leave a chatroom
//   socket.on("leaveChatroom", async (data) => {
//     const { chatroomId } = data;
//     socket.leave(chatroomId);
//     console.log(`Socket ${socket.id} left chatroom ${chatroomId}`);
//   });

//   // Create a message in a chatroom
//   socket.on("createMessage", async (data) => {
//     const { chatroomId, senderId, message } = data;
//     const chatroom = await ChatRoom.findById(chatroomId);
//     if (!chatroom) {
//       console.error(`Chatroom ${chatroomId} not found`);
//       return;
//     }
//     const log = {
//       senderId,
//       message,
//       timestamp: Date.now(),
//     };
//     chatroom.logs.push(log);
//     await chatroom.save();
//     io.to(chatroomId).emit("messageCreated", log);
//   });

//   // Disconnect the socket
//   socket.on("disconnect", () => {
//     console.log(`Socket disconnected: ${socket.id}`);
//   });
// });

// // Define the routes
// router.get("/chatroom/:chatroomId", async (req, res) => {
//   try {
//     const chatroom = await ChatRoom.findById(req.params.chatroomId).populate(
//       "participants",
//       "-password"
//     );
//     if (!chatroom) {
//       return res.status(404).json({ error: "Chatroom not found" });
//     }
//     res.json(chatroom);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Server error" });
//   }
// });

// router.post("/chatroom", async (req, res) => {
//   const { participants } = req.body;
//   if (!participants || participants.length < 2) {
//     return res
//       .status(400)
//       .json({ error: "Chatroom must have at least 2 participants" });
//   }
//   try {
//     const chatroom = new ChatRoom({ participants });
//     await chatroom.save();
//     res.json(chatroom);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Server error" });
//   }
// });

// router.get("/user/:userId", async (req, res) => {
//   try {
//     const user = await User.findById(req.params.userId);
//     if (!user) {
//       return res.status(404).json({ error: "User not found" });
//     }
//     res.json(user);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Server error" });
//   }
// });

// router.post("/user/:userId/friends", async (req, res) => {
//   try {
//     const user = await User.findById(req.params.userId);
//     if (!user) {
//       return res.status(404).json({ error: "User not found" });
//     }
//     const { friendId } = req.body;
//     const friend = await User.findById(friendId);
//     if (!friend) {
//       return res.status(404).json({ error: "Friend not found" });
//     }
//     if (user.friends.includes(friendId)) {
//       return res
//         .status(400)
//         .json({ error: "You are already friends with this user" });
//     }
//     user.friends.push(friendId);
//     await user.save();
//     res.json(user);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Server error" });
//   }
// });

// module.exports = { router, server };

app.listen(port, () => {
  console.log("Server us up on port " + port);
});
