import {
  inviteUser,
  acceptInvitation,
  rejectInvitation,
  promoteParticipant,
  demoteOwner,
} from "../utils/chatRoomUtils.js";

import { createChatRoom } from "./studyRoomController.js";

import Message from "../models/messages.js"; // added import
import { updateUserSocket, deleteUserSocket } from "../utils/socketUtils.js";
import User from "../models/user.js";

function socketController(io) {
  io.on("connection", async (socket) => {
    let userId;

    if (socket.request.user) {
      userId = socket.request.user._id;
    } else {
      console.log("User is not authenticated.");
    }

    if (socket.request.user.socketIds.length > 0) {
      socket.request.user.socketIds.forEach((socketId) => {
        io.to(socketId).emit("logged-in-other-device", {
          message: "Logged in other device",
        });
      });
    }

    const user = await User.findById(userId);

    user.socketIds = [];

    await user.save();

    await updateUserSocket(userId, socket.id);
    console.log("User is authenticated. User id:", socket.request.user.id);

    socket.on("join-room", async ({ roomId }) => {
      socket.join(roomId);
    });

    socket.on("leave-room", async ({ roomId }) => {
      socket.leave(roomId);
    });

    socket.on("new-pending-participant", ({ roomId, userId }) => {
      console.log(`New pending participant in room ${roomId}: ${userId}`);
    });

    socket.on("send-message", async ({ roomId, userId, message }) => {
      await Message.create({ roomId, userId, message });
      io.to(roomId).emit("message-sent", { roomId, userId, message });
    });

    // socket.on("create-chat-room", async ({ name, participants }) => {
    //   try {
    //     const chatRoom = await createChatRoom(userId, name, participants);
    //     socket.emit("chat-room-created", { chatRoom });
    //   } catch (err) {
    //     console.error(err);
    //   }
    // });

    // socket.on("invite-user", async ({ roomId, inviteeId }) => {
    //   try {
    //     await inviteUser(roomId, inviteeId);
    //   } catch (error) {
    //     io.to(userId).emit("error", { message: error.message });
    //   }
    // });

    // socket.on("accept-invitation", async ({ roomId }) => {
    //   try {
    //     await acceptInvitation(roomId, userId);
    //     socket.emit("join-room", { roomId });
    //     io.to(roomId).emit("participant-joined", { roomId, userId });
    //   } catch (error) {
    //     socket.emit("error", { message: "Failed to accept invite" });
    //     console.error(error);
    //   }
    // });

    // socket.on("reject-invitation", async ({ roomId }) => {
    //   try {
    //     await rejectInvitation(roomId, userId);
    //     socket.emit("invite-rejected", { roomId });
    //   } catch (error) {
    //     socket.emit("error", { message: "Failed to reject invite" });
    //     console.error(error);
    //   }
    // });

    // socket.on("promote-participant", async ({ roomId, id }) => {
    //   await promoteParticipant(roomId, id);
    // });

    // socket.on("demote-owner", async ({ roomId, id }) => {
    //   await demoteOwner(roomId, id);
    // });

    socket.onAny((eventName, ...args) => {
      console.log(`Event ${eventName} fired with args:`, args);
    });

    socket.on("disconnect", async () => {
      const userId = socket.request.user._id;
      console.log(`Socket ${socket.id} disconnected for user ${userId}`);
      await deleteUserSocket(userId, socket.id);
    });
  });
}

export default socketController;
