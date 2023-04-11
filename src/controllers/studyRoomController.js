import ChatRoom from "../models/chatRoom.js";
import Message from "../models/messages.js";
import { getUserSocket } from "../utils/socketUtils.js";
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

const joinRoom = async (req, res) => {
  const io = req.app.get("socketio");
  const { roomId } = req.params;
  const userId = req.user._id;

  try {
    const participant = await ChatRoom.isParticipant(roomId, userId);
    if (
      (participant && participant.status === "accepted") ||
      participant.status === "owner"
    ) {
      // Cancel other rooms where the user is a participant
      const userRooms = await ChatRoom.getUserRooms(userId);
      for (const room of userRooms) {
        if (room._id !== roomId) {
          await ChatRoom.cancelParticipant(room._id, userId);
          io.to(room._id).emit("participant-cancelled", {
            roomId: room._id,
            userId,
          });
        }
      }
      res.status(200).send();
    } else if (participant && participant.status === "pending") {
      // If user has already requested to join the room, return an error message
      res
        .status(409)
        .json({ error: "User has already requested to join this room." });
    } else {
      // If user is not already a participant, add them to the list of pending participants
      await ChatRoom.addParticipant(roomId, userId, "pending");
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
      res.status(202).send();
    }
  } catch (err) {
    console.error(err);
    res.status(500).send();
  }
};

const getPendingChatRoom = async (req, res) => {
  try {
    const chatRoom = await ChatRoom.find({
      "participants.userId": req.user._id,
      "participants.status": "pending",
    }).populate("participants.userId");

    if (!chatRoom) {
      return res.status(404).json({ msg: "No pending chat room found" });
    }

    res.status(200).json(chatRoom);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
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
    await Message.create({ roomId, userId: req.user._id, message });

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

const getOwnerRoomPendingParticipants = async (req, res) => {
  const { roomId } = req.params;
  const owner = req.user._id;

  try {
    // Check if the user is the owner of the chat room
    const chatRoom = await ChatRoom.findById(roomId);
    // const chatRoom = await ChatRoom.findOne({ owner: owner }); use only if you want to only get the owner's room
    if (!chatRoom) {
      throw new Error("Chat room not found");
    }
    if (String(chatRoom.owner) !== String(owner)) {
      return res.status(401).send("Unauthorized");
    }

    const pendingParticipants = chatRoom.participants.filter(
      (p) => p.status === "pending"
    );

    res.status(200).send({ pendingParticipants });
  } catch (err) {
    console.error(err);
    res.status(500).send();
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

const acceptUserRequest = async (req, res) => {
  const io = req.app.get("socketio");
  const { roomId, userId } = req.params;
  const owner = req.user._id;

  try {
    // Check if the user is the owner of the chat room
    const chatRoom = await ChatRoom.findById(roomId);
    // const chatRoom = await ChatRoom.findOne({ owner: owner }); use only if you want to only get the owner's room
    if (!chatRoom) {
      return res.status(404).send("Chat room not found");
    }
    if (String(chatRoom.owner) !== String(owner)) {
      return res.status(401).send("Unauthorized");
    }

    const pendingParticipants = chatRoom.participants.filter(
      (p) => p.status === "pending"
    );

    // Find the participant with the given user ID in the pending list
    const participant = pendingParticipants.find(
      (p) => String(p.userId) === userId
    );

    if (!participant) {
      return res.send("User is not in the pending list");
    }

    // Change the participant's status to accepted
    participant.status = "accepted";

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

    await chatRoom.save();

    // Send a notification to the accepted participant
    const socketId = getUserSocket(userId);
    if (socketId) {
      io.to(socketId).emit("participant-accepted", {
        roomId: chatRoom._id,
        userId,
      });
    }

    res.status(200).send();
  } catch (err) {
    console.error(err);
    res.status(500).send();
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

const getUserChatRooms = async (req, res) => {
  try {
    const userId = req.user._id;

    // Find the chat room the user has joined or owns
    const chatRoom = await ChatRoom.findOne({
      $or: [
        { owner: userId },
        {
          participants: { $elemMatch: { userId: userId, status: "accepted" } },
        },
      ],
    });

    if (!chatRoom) {
      return res.send("Chat room not found");
    }

    // Fetch the messages for the chat room
    const messages = await Message.find({ roomId: chatRoom._id })
      .sort("-createdAt")
      .limit(50);

    res.status(200).json({
      ...chatRoom.toObject(),
      messages: messages.reverse(),
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
};

const pendingParticipants = async (req, res) => {
  const { roomId } = req.params;

  try {
    const chatRoom = await ChatRoom.findById(roomId).populate({
      path: "participants",
      match: { status: "pending" },
      populate: {
        path: "userId",
        select: "firstName lastName",
      },
    });

    if (!chatRoom) {
      res.status(404).send();
    }

    res.send(chatRoom);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
};

export {
  joinRoom,
  createChatRoom,
  acceptUserRequest,
  getOwnerRoomPendingParticipants,
  getPendingChatRoom,
  getUserChatRooms,
  getPublicRooms,
  getPrivateRooms,
  getMessages,
  sendMessage,
  getParticipants,
  pendingParticipants,
  sendInvite,
  acceptInvite,
};
