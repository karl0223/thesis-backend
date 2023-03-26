// Import the required dependencies
import ChatRoom from "../models/chatRoom.js";

// Create a new chat room and add the owner as a participant
const createChatRoom = async (ownerId) => {
  const chatRoom = await ChatRoom.create({ owner: ownerId });
  await chatRoom.addParticipant(ownerId, "owner");
  return chatRoom;
};

// Invite a user to a chat room
const inviteUser = async (roomId, userId) => {
  //var io = req.app.get("socketio");
  const participant = await ChatRoom.isParticipant(roomId, userId);
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
    await ChatRoom.addPendingParticipant(roomId, userId);
    // Emit an "invitation" event to the user
    io.to(userId).emit("invitation", { roomId });
    // Emit a "new-pending-participant" event to the chat room owner to notify them of the new pending participant
    const owner = await ChatRoom.getOwner(roomId);
    if (owner) {
      io.to(owner._id).emit("new-pending-participant", { roomId, userId });
    }
  }
};

// Accept a chat room invitation
const acceptInvitation = async (roomId, userId) => {
  //var io = req.app.get("socketio");
  await ChatRoom.updateParticipantStatus(roomId, userId, "accepted");
  // Emit a "join-accepted" event to the user to indicate that their request has been accepted
  io.to(userId).emit("join-accepted", { roomId });
  // Emit a "user-joined" event to all users in the chat room to notify them of the new user
  io.to(roomId).emit("user-joined", { roomId, userId });
};

// Reject a chat room invitation
const rejectInvitation = async (roomId, userId) => {
  //var io = req.app.get("socketio");
  await ChatRoom.removeParticipant(roomId, userId);
  // Emit a "join-rejected" event to the user to indicate that their request has been rejected
  io.to(userId).emit("join-rejected", { roomId });
  // Emit a "user-left" event to all users in the chat room to notify them of the user leaving
  io.to(roomId).emit("user-left", { roomId, userId });
};

// Leave a chat room
const leaveChatRoom = async (roomId, userId) => {
  //var io = req.app.get("socketio");
  await ChatRoom.removeParticipant(roomId, userId);
  // Emit a "user-left" event to all users in the chat room to notify them of the user leaving
  io.to(roomId).emit("user-left", { roomId, userId });
};

// Promote a participant to owner
const promoteParticipant = async (roomId, userId) => {
  //var io = req.app.get("socketio");
  await ChatRoom.updateParticipantStatus(roomId, userId, "owner");
  // Emit an "owner-promoted" event to the user to indicate that they have been promoted
  io.to(userId).emit("owner-promoted", { roomId });
};

// Demote an owner to participant
const demoteOwner = async (roomId, userId) => {
  //var io = req.app.get("socketio");
  await ChatRoom.updateParticipantStatus(roomId, userId, "accepted");
  // Emit an "owner-demoted" event to the user to indicate that they have been demoted
  io.to(userId).emit("owner-demoted", { roomId });
};

// Kick a participant from the chat room
const kickParticipant = async (roomId, userId) => {
  //var io = req.app.get("socketio");
  await ChatRoom.removeParticipant(roomId, userId);
  // Emit a "user-kicked" event to the user to indicate that they have been kicked
  io.to(userId).emit("user-kicked", { roomId });
  // Emit a "user-left" event to all users in the chat room to notify them of the user leaving
  io.to(roomId).emit("user-left", { roomId, userId });
};

export {
  createChatRoom,
  inviteUser,
  acceptInvitation,
  rejectInvitation,
  leaveChatRoom,
  promoteParticipant,
  demoteOwner,
  kickParticipant,
};
