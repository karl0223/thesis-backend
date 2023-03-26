import {
  createChatRoom,
  inviteUser,
  acceptInvitation,
  rejectInvitation,
  leaveChatRoom,
  promoteParticipant,
  demoteOwner,
  kickParticipant,
} from "./groupChatController.js";

function socketController(io) {
  io.on("connection", (socket) => {
    console.log(`Socket ${socket.id} connected`);

    socket.on("join-room", async ({ roomId, userId }) => {
      try {
        const participant = await ChatRoom.isParticipant(roomId, userId);
        if (
          (participant && participant.status === "accepted") ||
          participant.status === "owner"
        ) {
          // If user is already a participant and their status is "accepted", let them join the room
          socket.join(roomId);
        } else {
          // If user is not already a participant or their status is "pending", add them to the list of pending participants
          await ChatRoom.addParticipant(roomId, userId, "pending");
          // Emit a "join-pending" event to the user to indicate that their request is pending
          socket.emit("join-pending", { roomId, userId });
          // Emit a "new-pending-participant" event to the chat room owner to notify them of the new pending participant
          const owner = await ChatRoom.getOwner(roomId);
          if (owner) {
            io.to(owner._id).emit("new-pending-participant", {
              roomId,
              userId,
            });
          }
        }
      } catch (err) {
        console.error(err);
      }
    });

    // Listen for send-message events
    socket.on("send-message", async ({ roomId, userId, message }) => {
      // Save the message to the database
      await Message.create({ roomId, userId, message });
      // Emit a "message-sent" event to all users in the chat room to notify them of the new message
      io.to(roomId).emit("message-sent", { roomId, userId, message });
    });

    // Listen for "create-room" events
    socket.on("create-room", async (ownerId) => {
      const chatRoom = await createChatRoom(ownerId);
      // Emit a "room-created" event to the owner with the new chat room details
      io.to(ownerId).emit("room-created", { roomId: chatRoom._id });
    });

    // Listen for "invite-user" events
    socket.on("invite-user", async ({ roomId, userId }) => {
      try {
        await inviteUser(roomId, userId);
      } catch (error) {
        // Emit an "error" event to the user if there was an error inviting them to the chat room
        io.to(userId).emit("error", { message: error.message });
      }
    });

    // Listen for "accept-invitation" events
    socket.on("accept-invitation", async ({ roomId, userId }) => {
      await acceptInvitation(roomId, userId);
    });

    // Listen for "reject-invitation" events
    socket.on("reject-invitation", async ({ roomId, userId }) => {
      await rejectInvitation(roomId, userId);
    });

    // Listen for "leave-room" events
    socket.on("leave-room", async ({ roomId, userId }) => {
      await leaveChatRoom(roomId, userId);
    });

    // Listen for "promote-participant" events
    socket.on("promote-participant", async ({ roomId, userId }) => {
      await promoteParticipant(roomId, userId);
    });

    // Listen for "demote-owner" events
    socket.on("demote-owner", async ({ roomId, userId }) => {
      await demoteOwner(roomId, userId);
    });

    // Listen for "kick-participant" events
    socket.on("kick-participant", async ({ roomId, userId }) => {
      await kickParticipant(roomId, userId);
    });

    // Listen for disconnections
    socket.on("disconnect", () => {
      console.log(`Socket ${socket.id} disconnected`);
    });
  });
}

export default socketController;
// module.exports = { socketController };
