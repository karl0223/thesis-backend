import app from "./app.js";
import http from "http";
import { Server } from "socket.io";
import ChatRoom from "./models/chatRoom.js";

const server = http.createServer(app);
const io = new Server(server);
const port = process.env.PORT;

io.on("connection", (socket) => {
  console.log("Client connected");

  socket.on("join-room", async ({ roomId, userId }) => {
    try {
      const participant = await ChatRoom.isParticipant(roomId, userId);
      if (participant && participant.status === "accepted") {
        // If user is already a participant and their status is "accepted", let them join the room
        socket.join(roomId);
      } else {
        // If user is not already a participant or their status is "pending", add them to the list of pending participants
        await ChatRoom.addParticipant(roomId, userId);
        // Emit a "join-pending" event to the user to indicate that their request is pending
        socket.emit("join-pending", { roomId, userId });
        // Emit a "new-pending-participant" event to the chat room owner to notify them of the new pending participant
        const owner = await ChatRoom.getOwner(roomId);
        if (owner) {
          io.to(owner.userId).emit("new-pending-participant", {
            roomId,
            userId,
          });
        }
      }
    } catch (err) {
      console.error(err);
    }
  });

  socket.on("accept-request", async ({ roomId, userId }) => {
    try {
      await ChatRoom.updateParticipantStatus(roomId, userId, "accepted");
      // Emit a "join-accepted" event to the user to indicate that their request has been accepted
      socket.emit("join-accepted", { roomId, userId });
      // Emit a "user-joined" event to all users in the chat room to notify them of the new user
      io.to(roomId).emit("user-joined", { roomId, userId });
    } catch (err) {
      console.error(err);
    }
  });

  socket.on("reject-request", async ({ roomId, userId }) => {
    try {
      await ChatRoom.updateParticipantStatus(roomId, userId, "rejected");
      // Emit a "join-rejected" event to the user to indicate that their request has been rejected
      socket.emit("join-rejected", { roomId, userId });
    } catch (err) {
      console.error(err);
    }
  });

  socket.on("new-message", async ({ roomId, userId, message }) => {
    try {
      const chatroom = await ChatRoom.findByIdAndUpdate(
        roomId,
        { $push: { logs: { senderId: userId, message } } },
        { new: true }
      );
      io.to(roomId).emit("message", {
        roomId,
        senderId: userId,
        message,
      });
    } catch (err) {
      console.error(err);
    }
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

app.listen(port, () => {
  console.log("Server us up on port " + port);
});
