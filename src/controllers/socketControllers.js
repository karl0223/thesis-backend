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

import User from "../models/user.js";
import { socketAuth } from "../middleware/auth.js";
import ChatRoom from "../models/chatRoom.js";
import Message from "../models/messages.js"; // added import

async function updateUserSocket(userId, socketId) {
  try {
    await User.updateOne({ _id: userId }, { socketId }, { upsert: true });
  } catch (error) {
    console.error(error);
  }
}

async function deleteUserSocket(userId) {
  try {
    await User.deleteOne({ userId });
  } catch (error) {
    console.error(error);
  }
}

async function getUserSocket(userId) {
  try {
    const user = await User.findOne({ userId });
    return user ? user.socketId : null;
  } catch (error) {
    console.error(error);
    return null;
  }
}

function socketController(io) {
  // io.use(socketAuth);

  // let userId;

  io.on("connection", async (socket) => {
    // socketAuth(socket, async () => {
    //   console.log(`User socket id: ${socket.id}`);
    //   // Your authenticated socket code here
    // });

    // console.log(socket.id);

    // if (socket.request.user) {
    //   console.log("User is authenticated. User id:", socket.request.user.id);
    //   userId = socket.request.user._id;
    // } else {
    //   console.log("User is not authenticated.");
    // }

    console.log(`Socket ${socket.id} connected`);

    const userId = socket.request.user._id;

    await updateUserSocket(userId, socket.id);

    console.log(`Socket ${socket.id} connected`);
    console.log(`User ${userId} connected`);

    socket.on("join-room", async ({ roomId }) => {
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
            const ownerSocketId = await getUserSocket(owner._id);
            if (ownerSocketId) {
              io.to(ownerSocketId).emit("new-pending-participant", {
                roomId,
                userId,
              });
            }
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
    socket.on("create-room", async () => {
      try {
        // Create a new chat room and add the owner as a participant
        const chatRoom = await createChatRoom(userId);
        // Emit a "chat-room-created" event to the user to notify them of the new chat room
        socket.emit("chat-room-created", { chatRoom });
      } catch (error) {
        // Emit an "error" event to the user if there was an error creating the chat room
        socket.emit("error", { message: error.message });
      }
    });

    // Listen for "invite-user" events
    socket.on("invite-user", async ({ roomId, inviteeId }) => {
      try {
        await inviteUser(roomId, userId, inviteeId);
      } catch (error) {
        // Emit an "error" event to the user if there was an error inviting them to the chat room
        io.to(userId).emit("error", { message: error.message });
      }
    });

    // Listen for "accept-invitation" events
    socket.on("accept-invitation", async ({ roomId }) => {
      try {
        await acceptInvitation(roomId, userId);
        // Emit a "join-room" event to the user to indicate that they have been added to the chat room
        socket.emit("join-room", { roomId });
        // Emit a "participant-joined" event to all users in the chat room to notify them of the new participant
        io.to(roomId).emit("participant-joined", { roomId, userId });
      } catch (error) {
        // Emit an "error" event to the user if there was an error accepting the invite
        socket.emit("error", { message: "Failed to accept invite" });
        console.error(error);
      }
    });

    // Listen for "reject-invitation" events
    socket.on("reject-invitation", async ({ roomId }) => {
      try {
        await rejectInvitation(roomId, userId);
        // Emit a "invite-rejected" event to the user to indicate that their invite has been rejected
        socket.emit("invite-rejected", { roomId });
      } catch (error) {
        // Emit an "error" event to the user if there was an error rejecting the invite
        socket.emit("error", { message: "Failed to reject invite" });
        console.error(error);
      }
    });

    // Listen for "leave-room" events
    socket.on("leave-room", async ({ roomId, id }) => {
      await leaveChatRoom(roomId, id);
    });

    // Listen for "promote-participant" events
    socket.on("promote-participant", async ({ roomId, id }) => {
      await promoteParticipant(roomId, id);
    });

    // Listen for "demote-owner" events
    socket.on("demote-owner", async ({ roomId, id }) => {
      await demoteOwner(roomId, id);
    });

    // Listen for "kick-participant" events
    socket.on("kick-participant", async ({ roomId, id }) => {
      await kickParticipant(roomId, id);
    });

    // Listen for disconnections
    socket.on("disconnect", async () => {
      const userId = socket.request.user._id;
      console.log(`Socket ${socket.id} disconnected for user ${userId}`);

      // Remove the user's socket ID from the database
      await deleteUserSocket(userId);
    });
  });
}

export default socketController;
// module.exports = { socketController };
