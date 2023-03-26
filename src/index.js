import app from "./app.js";
const port = process.env.PORT;

// Listen for connections
// io.on("connection", (socket) => {
//   console.log(`Socket ${socket.id} connected`);

//   socket.on("join-room", async ({ roomId, userId }) => {
//     try {
//       const participant = await ChatRoom.isParticipant(roomId, userId);
//       if (
//         (participant && participant.status === "accepted") ||
//         participant.status === "owner"
//       ) {
//         // If user is already a participant and their status is "accepted", let them join the room
//         socket.join(roomId);
//       } else {
//         // If user is not already a participant or their status is "pending", add them to the list of pending participants
//         await ChatRoom.addParticipant(roomId, userId, "pending");
//         // Emit a "join-pending" event to the user to indicate that their request is pending
//         socket.emit("join-pending", { roomId, userId });
//         // Emit a "new-pending-participant" event to the chat room owner to notify them of the new pending participant
//         const owner = await ChatRoom.getOwner(roomId);
//         if (owner) {
//           io.to(owner._id).emit("new-pending-participant", {
//             roomId,
//             userId,
//           });
//         }
//       }
//     } catch (err) {
//       console.error(err);
//     }
//   });

//   // Listen for send-message events
//   socket.on("send-message", async ({ roomId, userId, message }) => {
//     // Save the message to the database
//     await Message.create({ roomId, userId, message });
//     // Emit a "message-sent" event to all users in the chat room to notify them of the new message
//     io.to(roomId).emit("message-sent", { roomId, userId, message });
//   });

//   // Listen for "create-room" events
//   socket.on("create-room", async (ownerId) => {
//     const chatRoom = await createChatRoom(ownerId);
//     // Emit a "room-created" event to the owner with the new chat room details
//     io.to(ownerId).emit("room-created", { roomId: chatRoom._id });
//   });

//   // Listen for "invite-user" events
//   socket.on("invite-user", async ({ roomId, userId }) => {
//     try {
//       await inviteUser(roomId, userId);
//     } catch (error) {
//       // Emit an "error" event to the user if there was an error inviting them to the chat room
//       io.to(userId).emit("error", { message: error.message });
//     }
//   });

//   // Listen for "accept-invitation" events
//   socket.on("accept-invitation", async ({ roomId, userId }) => {
//     await acceptInvitation(roomId, userId);
//   });

//   // Listen for "reject-invitation" events
//   socket.on("reject-invitation", async ({ roomId, userId }) => {
//     await rejectInvitation(roomId, userId);
//   });

//   // Listen for "leave-room" events
//   socket.on("leave-room", async ({ roomId, userId }) => {
//     await leaveChatRoom(roomId, userId);
//   });

//   // Listen for "promote-participant" events
//   socket.on("promote-participant", async ({ roomId, userId }) => {
//     await promoteParticipant(roomId, userId);
//   });

//   // Listen for "demote-owner" events
//   socket.on("demote-owner", async ({ roomId, userId }) => {
//     await demoteOwner(roomId, userId);
//   });

//   // Listen for "kick-participant" events
//   socket.on("kick-participant", async ({ roomId, userId }) => {
//     await kickParticipant(roomId, userId);
//   });

//   // Listen for disconnections
//   socket.on("disconnect", () => {
//     console.log(`Socket ${socket.id} disconnected`);
//   });
// });

app.listen(port, () => {
  console.log("Server us up on port " + port);
});

// io.on("connection", (socket) => {
//   console.log("Client connected");
//   // Set the userId property of the socket when the user connects
//   socket.userId = userId;

//   socket.on("join-room", async ({ roomId, userId }) => {
//     try {
//       const participant = await ChatRoom.isParticipant(roomId, userId);
//       if (participant && participant.status === "accepted") {
//         // If user is already a participant and their status is "accepted", let them join the room
//         socket.join(roomId);
//         // Emit a "join-successful" event to the client with their socket id
//         socket.emit("join-successful", { roomId, userId, id: socket.id });
//       } else {
//         // If user is not already a participant or their status is "pending", add them to the list of pending participants
//         await ChatRoom.addParticipant(roomId, userId);
//         // Emit a "join-pending" event to the user to indicate that their request is pending
//         socket.emit("join-pending", { roomId, userId });
//         // Emit a "new-pending-participant" event to the chat room owner to notify them of the new pending participant
//         const owner = await ChatRoom.getOwner(roomId);
//         if (owner) {
//           io.to(owner.userId).emit("new-pending-participant", {
//             roomId,
//             userId,
//           });
//         }
//       }
//     } catch (err) {
//       console.error(err);
//     }
//   });

//   socket.on("accept-request", async ({ roomId, userId }) => {
//     try {
//       await ChatRoom.updateParticipantStatus(roomId, userId, "accepted");
//       // Emit a "join-accepted" event to the user to indicate that their request has been accepted
//       socket.emit("join-accepted", { roomId, userId });
//       // Emit a "user-joined" event to all users in the chat room to notify them of the new user
//       io.to(roomId).emit("user-joined", { roomId, userId });
//     } catch (err) {
//       console.error(err);
//     }
//   });

//   socket.on("reject-request", async ({ roomId, userId }) => {
//     try {
//       await ChatRoom.updateParticipantStatus(roomId, userId, "rejected");
//       // Emit a "join-rejected" event to the user to indicate that their request has been rejected
//       socket.emit("join-rejected", { roomId, userId });
//     } catch (err) {
//       console.error(err);
//     }
//   });

//   socket.on("new-message", async ({ roomId, userId, message }) => {
//     try {
//       const chatroom = await ChatRoom.findByIdAndUpdate(
//         roomId,
//         { $push: { logs: { senderId: userId, message } } },
//         { new: true }
//       );
//       io.to(roomId).emit("message", {
//         roomId,
//         senderId: userId,
//         message,
//       });
//     } catch (err) {
//       console.error(err);
//     }
//   });

//   socket.on("disconnect", () => {
//     console.log("Client disconnected");
//   });
// });
