import ChatRoom from "../models/chatRoom.js";
import Message from "../models/messages.js";
import { inviteUser, acceptInvitation } from "./groupChatController.js";

// Create a new chat room and add the owner as a participant
const createChatRoom = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "tutor") {
      throw new Error("Only tutors can create study rooms");
    }

    const { name, status } = req.body;
    if (!name || !status) {
      throw new Error("Name and status are required");
    }

    const chatRoom = await ChatRoom.create({
      owner: req.user._id,
      name,
      status,
    });

    await ChatRoom.addParticipant(chatRoom._id, req.user._id, "owner");
    res.send(chatRoom);
  } catch (err) {
    console.log(err);
    res.status(403).send("Access denied");
  }
};

const getPublicRooms = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const startIndex = (page - 1) * limit;

    const totalRooms = await ChatRoom.countDocuments({ status: "public" });
    const totalPages = Math.ceil(totalRooms / limit);

    const studyRooms = await ChatRoom.find({ status: "public" })
      .skip(startIndex)
      .limit(limit);

    res.json({
      rooms: studyRooms,
      totalPages,
      currentPage: page,
      totalRooms,
    });
  } catch (err) {
    console.log(err);
    res.status(500).send("Server Error");
  }
};

const getPrivateRooms = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const startIndex = (page - 1) * limit;

    const totalRooms = await ChatRoom.countDocuments({ status: "private" });
    const totalPages = Math.ceil(totalRooms / limit);

    const studyRooms = await ChatRoom.find({ status: "private" })
      .skip(startIndex)
      .limit(limit);

    res.json({
      rooms: studyRooms,
      totalPages,
      currentPage: page,
      totalRooms,
    });
  } catch (err) {
    console.log(err);
    res.status(500).send("Server Error");
  }
};

const getMessages = async (req, res) => {
  try {
    const messages = await Message.find({ roomId: req.params.roomId }).populate(
      "userId",
      "firstName"
    );
    res.json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

const sendMessage = async (req, res) => {
  try {
    const { roomId, message } = req.body;

    // Save the message to the database
    await Message.create({ roomId, userId, message });

    // Emit a "message-sent" event to all users in the chat room to notify them of the new message
    const io = req.app.get("socketio");
    io.to(roomId).emit("message-sent", {
      roomId,
      userId: req.user_id,
      message,
    });

    res.status(200).send("Message sent successfully.");
  } catch (err) {
    console.log(err);
    res.status(500).send("Server Error");
  }
};

const getParticipants = async (req, res) => {
  const { roomId } = req.params;

  try {
    const chatRoom = await ChatRoom.findById(roomId).populate(
      "participants.userId"
    );
    if (!chatRoom) {
      return res.status(404).send("Chat room not found");
    }

    const participants = chatRoom.participants.map((participant) => {
      return {
        userId: participant.userId._id,
        username: participant.userId.firstName,
        status: participant.status,
      };
    });

    return res.status(200).send(participants);
  } catch (err) {
    console.error(err);
    return res.status(500).send("Internal server error");
  }
};

const sendInvite = async (req, res) => {
  const io = req.app.get("socketio");
  const { roomId, inviteeId } = req.body;

  try {
    await inviteUser(io, roomId, inviteeId);
    res.status(200).send("User invited successfully.");
  } catch (error) {
    // Send an error response if there was an error inviting the user to the chat room
    res.status(400).send({ message: error.message });
  }
};

const acceptInvite = async (req, res) => {
  const io = req.app.get("socketio");
  const { roomId } = req.body;
  const userId = req.user._id;

  try {
    await acceptInvitation(io, roomId, userId);

    // Emit a "join-room" event to the user to indicate that they have been added to the chat room
    io.to(userId).emit("join-room", { roomId });
    // Emit a "participant-joined" event to all users in the chat room to notify them of the new participant
    io.to(roomId).emit("participant-joined", { roomId, userId });

    res.status(200).send("Invitation accepted successfully.");
  } catch (error) {
    // Emit an "error" event to the user if there was an error accepting the invite
    io.to(userId).emit("error", { message: "Failed to accept invite" });
    console.error(error);

    res.status(500).send("Failed to accept invitation.");
  }
};

export {
  createChatRoom,
  getPublicRooms,
  getPrivateRooms,
  getMessages,
  sendMessage,
  getParticipants,
  sendInvite,
  acceptInvite,
};
