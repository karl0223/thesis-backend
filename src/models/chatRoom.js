const mongoose = require("mongoose");

const chatRoomSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  participants: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
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

chatRoomSchema.statics.isParticipant = async function (chatroomId, userId) {
  const count = await this.countDocuments({
    _id: chatroomId,
    participants: userId,
  });
  return count > 0;
};

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
      $pull: { participants: userId },
    },
    { new: true }
  );
  return chatroom;
};

const ChatRoom = mongoose.model("ChatRoom", chatRoomSchema);

module.exports = ChatRoom;
