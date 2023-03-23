import mongoose from "mongoose";

const chatRoomSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  participants: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      status: {
        type: String,
        enum: ["requested", "accepted", "rejected"],
        default: "requested",
      },
    },
  ],
  logs: [
    {
      senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      message: {
        type: String,
        required: true,
      },
      timestamp: {
        type: Date,
        default: Date.now,
      },
    },
  ],
});

chatRoomSchema.statics.getOwner = async function (roomId) {
  const chatroom = await this.findById(roomId).populate("owner");
  if (!chatroom) {
    throw new Error("Chat room not found");
  }
  return chatroom.owner;
};

chatRoomSchema.statics.isParticipant = async function (chatroomId, userId) {
  const count = await this.countDocuments({
    _id: chatroomId,
    "participants.user": userId,
    "participants.status": "accepted",
  });
  return count > 0;
};

// chatRoomSchema.statics.addPendingParticipant = async function (
//   chatroomId,
//   userId
// ) {
//   const chatroom = await this.findById(chatroomId);
//   if (!chatroom) {
//     throw new Error("Chat room not found");
//   }
//   const participant = chatroom.participants.find((p) => p.user.equals(userId));
//   if (participant) {
//     if (participant.status !== "requested") {
//       participant.status = "requested";
//       await chatroom.save();
//     }
//   } else {
//     chatroom.participants.push({ user: userId });
//     await chatroom.save();
//   }
//   return chatroom;
// };

chatRoomSchema.statics.addParticipant = async function (chatroomId, userId) {
  const chatroom = await this.findByIdAndUpdate(
    chatroomId,
    {
      $addToSet: { participants: userId },
    },
    { new: true }
  );
  return chatroom;
};

chatRoomSchema.statics.removeParticipant = async function (chatroomId, userId) {
  const chatroom = await this.findByIdAndUpdate(
    chatroomId,
    {
      $pull: { participants: { user: userId } },
    },
    { new: true }
  );
  return chatroom;
};

chatRoomSchema.statics.updateParticipantStatus = async function (
  chatroomId,
  userId,
  newStatus
) {
  const chatroom = await this.findOneAndUpdate(
    {
      _id: chatroomId,
      "participants.user": userId,
    },
    {
      $set: { "participants.$.status": newStatus },
    },
    { new: true }
  );
  return chatroom;
};

const ChatRoom = mongoose.model("ChatRoom", chatRoomSchema);

export default ChatRoom;
