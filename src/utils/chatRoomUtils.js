// Import the required dependencies
import ChatRoom from "../models/chatRoom.js";

const cancelAllRoomRequests = async (userId, chatRoomId) => {
  const io = req.app.get("socketio");

  try {
    const userRooms = await ChatRoom.getUserRooms(userId);
    for (const room of userRooms) {
      if (room.owner && room.owner.toString() === userId.toString()) {
        continue; // Skip to the next iteration of the loop
      }
      if (room._id.toString() !== chatRoomId.toString()) {
        await ChatRoom.cancelParticipant(room._id, userId);
        io.to(room._id).emit("participant-cancelled", {
          roomId: room._id,
          userId,
        });
      }
    }

    await chatRoom.save();
  } catch (err) {
    console.error(err);
  }
};

// Invite a user to a chat room
const inviteUser = async (io, roomId, inviteeId) => {
  const participant = await ChatRoom.isParticipant(roomId, inviteeId);
  if (participant) {
    if (participant.status === "pending") {
      // If the user is already invited, do nothing
      return;
    } else {
      // If the user is already a participant, throw an error
      throw new Error("User is already a participant in the chat room");
    }
  } else {
    // Add the user as a pending participant
    await ChatRoom.addPendingParticipant(roomId, inviteeId);
    // Emit an "invitation" event to the user
    io.to(inviteeId).emit("invitation", { roomId });
    // Emit a "new-pending-participant" event to the chat room owner to notify them of the new pending participant
    const owner = await ChatRoom.getOwner(roomId);
    if (owner) {
      io.to(owner._id).emit("new-pending-participant", {
        roomId,
        userId: inviteeId,
      });
    }
  }
};

// Accept a chat room invitation
const acceptInvitation = async (io, roomId, userId) => {
  try {
    await ChatRoom.updateParticipantStatus(roomId, userId, "accepted");

    // Fetch the user's joined rooms
    const userRooms = await ChatRoom.getUserRooms(userId);

    // Cancel the user's participation in other rooms
    for (const room of userRooms) {
      if (room.owner.toString() === userId.toString()) {
        continue; // Skip to the next iteration of the loop
      }

      if (room._id.toString() !== roomId.toString()) {
        await ChatRoom.cancelParticipant(room._id, userId);
      }
    }

    // Emit a "join-accepted" event to the user to indicate that their request has been accepted
    io.to(userId).emit("join-accepted", { roomId });
    // Emit a "user-joined" event to all users in the chat room to notify them of the new user
    io.to(roomId).emit("user-joined", { roomId, userId });
  } catch (error) {
    throw new Error("Failed to accept invitation");
  }
};

// Reject a chat room invitation
const rejectInvitation = async (roomId, userId) => {
  const io = req.app.get("socketio");
  await ChatRoom.removeParticipant(roomId, userId);
  // Emit a "join-rejected" event to the user to indicate that their request has been rejected
  io.to(userId).emit("join-rejected", { roomId });
  // Emit a "user-left" event to all users in the chat room to notify them of the user leaving
  io.to(roomId).emit("user-left", { roomId, userId });
};

// Promote a participant to owner
const promoteParticipant = async (roomId, userId) => {
  const io = req.app.get("socketio");
  await ChatRoom.updateParticipantStatus(roomId, userId, "owner");
  // Emit an "owner-promoted" event to the user to indicate that they have been promoted
  io.to(userId).emit("owner-promoted", { roomId });
};

// Demote an owner to participant
const demoteOwner = async (roomId, userId) => {
  const io = req.app.get("socketio");
  await ChatRoom.updateParticipantStatus(roomId, userId, "accepted");
  // Emit an "owner-demoted" event to the user to indicate that they have been demoted
  io.to(userId).emit("owner-demoted", { roomId });
};

export {
  cancelAllRoomRequests,
  inviteUser,
  acceptInvitation,
  rejectInvitation,
  promoteParticipant,
  demoteOwner,
};
