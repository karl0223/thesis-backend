// Import the required dependencies
import mongoose from "mongoose";

// Define the message schema
const messageSchema = new mongoose.Schema(
  {
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ChatRoom",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    message: {
      type: String,
      required: false,
    },
    fileUrl: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Create the message model
const Message = mongoose.model("Message", messageSchema);

export default Message;
