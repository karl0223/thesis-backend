import mongoose from "mongoose";
import Message from "../models/messages.js";

const participantSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    status: {
      type: String,
      enum: ["accepted", "pending", "owner"],
      default: "pending",
    },
  },
  { _id: false }
);

const chatRoomSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  participants: [participantSchema],
  messages: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },
  ],
  status: {
    type: String,
    enum: ["public", "private"],
    default: "public",
  },
});

chatRoomSchema.methods.getMessages = async function () {
  const messages = await Message.find({ roomId: this._id });
  return messages;
};

chatRoomSchema.statics.getUserRooms = async function (userId) {
  try {
    // Find all the chat rooms where the given user is a participant
    const rooms = await this.find({ "participants.userId": userId })
      .populate("owner", "name")
      .select("name owner");

    return rooms;
  } catch (err) {
    console.error(err);
    throw new Error("Failed to fetch user chat rooms");
  }
};

chatRoomSchema.methods.cancelParticipant = async function (userId) {
  try {
    // Find the participant with the given user ID
    const participant = this.participants.find(
      (p) => String(p.userId) === String(userId)
    );

    if (!participant) {
      throw new Error("User is not a participant in this chat room");
    }

    if (participant.status === "owner") {
      throw new Error("Owner cannot be cancelled from the chat room");
    }

    // Remove the participant from the list of participants
    this.participants = this.participants.filter(
      (p) => String(p.userId) !== String(userId)
    );

    // Save the updated chat room
    await this.save();
  } catch (err) {
    console.error(err);
    throw new Error("Failed to cancel participant from the chat room");
  }
};

chatRoomSchema.statics.isParticipant = async function (roomId, userId) {
  const chatRoom = await this.findOne({ _id: roomId });
  if (!chatRoom) {
    return false;
  }
  return chatRoom.participants.find(
    (p) => p.userId.toString() === userId.toString()
  );
};

chatRoomSchema.statics.addParticipant = async function (
  roomId,
  userId,
  status
) {
  const chatRoom = await this.findOne({ _id: roomId });
  if (!chatRoom) {
    throw new Error("Chat room not found");
  }
  chatRoom.participants.push({ userId, status });
  await chatRoom.save();
};

chatRoomSchema.statics.addPendingParticipant = async function (roomId, userId) {
  await this.addParticipant(roomId, userId, "pending");
};

chatRoomSchema.statics.updateParticipantStatus = async function (
  roomId,
  userId,
  newStatus
) {
  const chatRoom = await this.findOne({ _id: roomId });
  if (!chatRoom) {
    throw new Error("Chat room not found");
  }
  const participant = chatRoom.participants.find(
    (p) => p.userId.toString() === userId.toString()
  );
  if (!participant) {
    throw new Error("User not a participant in the chat room");
  }
  participant.status = newStatus;
  await chatRoom.save();
};

chatRoomSchema.statics.removeParticipant = async function (roomId, userId) {
  const chatRoom = await this.findOne({ _id: roomId });
  if (!chatRoom) {
    throw new Error("Chat room not found");
  }
  const index = chatRoom.participants.findIndex(
    (p) => p.userId.toString() === userId.toString()
  );
  if (index === -1) {
    throw new Error("User not a participant in the chat room");
  }
  chatRoom.participants.splice(index, 1);
  await chatRoom.save();
};

chatRoomSchema.statics.getOwner = async function (roomId) {
  const chatroom = await this.findById(roomId).populate("owner");
  if (!chatroom) {
    throw new Error("Chat room not found");
  }
  return chatroom.owner;
};

const ChatRoom = mongoose.model("ChatRoom", chatRoomSchema);

export default ChatRoom;
