import HelpRequest from "../models/askHelp.js";
import ChatRoom from "../models/chatRoom.js";
import { getUserSocket } from "../utils/socketUtils.js";

const createRequest = async (req, res) => {
  const io = req.app.get("socketio");

  try {
    const {
      name,
      status,
      location,
      schedule,
      subjectCode,
      description,
      subtopics,
    } = req.body;
    if (
      !name ||
      !status ||
      !location ||
      !schedule ||
      !subjectCode ||
      !description ||
      !subtopics
    ) {
      return res.status(400).send("All fields are required");
    }

    const { tutorId } = req.params;

    // Check if user already has an existing request
    const existingRequest = await HelpRequest.findOne({
      tutorId,
      studentId: req.user._id,
      reqStatus: "pending",
    });

    if (existingRequest) {
      return res
        .status(400)
        .send("You already have an existing request with this tutor");
    }

    const existingChatRoom = await ChatRoom.findOne({
      $or: [
        { owner: req.user._id },
        {
          participants: {
            $elemMatch: { userId: req.user._id },
          },
        },
      ],
    });

    if (existingChatRoom) {
      return res.status(400).send("You still have an existing chatroom");
    }

    const tutorSocket = await getUserSocket(tutorId);

    const newRequest = await HelpRequest.create({
      tutorId,
      studentId: req.user._id,
      name,
      status,
      location,
      schedule,
      subject: {
        subjectCode,
        description,
        subtopics,
      },
      reqStatus: "pending",
    });

    const requestInfo = await HelpRequest.findById(newRequest._id)
      .populate("tutorId", "firstName lastName")
      .populate("studentId", " firstName lastName");

    io.to(tutorSocket).emit("new-request", requestInfo);
    res.send(requestInfo);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error creating help request");
  }
};

const getRequests = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "tutor") {
      return res.status(401).send("Only tutors can view help requests");
    }

    const requests = await HelpRequest.find({
      tutorId: req.user._id,
      reqStatus: "pending",
    })
      .populate("tutorId", "firstName lastName")
      .populate("studentId", "firstName lastName");

    res.send(requests);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching help requests");
  }
};

const acceptRequest = async (req, res) => {
  const io = req.app.get("socketio");

  try {
    if (!req.user || req.user.role !== "tutor") {
      return res
        .status(401)
        .send("Only tutors can accept or reject help requests");
    }

    const { requestId, reqStatus } = req.params;

    const helpRequest = await HelpRequest.findById(requestId)
      .populate("tutorId", "firstName lastName")
      .populate("studentId", "firstName lastName");

    const tuteeSocket = await getUserSocket(helpRequest.studentId._id);

    const existingChatRoom = await ChatRoom.findOne({
      $or: [
        { owner: req.user._id },
        {
          participants: {
            $elemMatch: { userId: req.user._id },
          },
        },
        {
          participants: {
            $elemMatch: { userId: helpRequest.studentId._id },
          },
        },
      ],
    });

    if (existingChatRoom) {
      return res.status(400).send("You still have an existing chatroom");
    }

    if (!helpRequest) {
      return res.status(404).send("Help request not found");
    }

    if (reqStatus !== "accepted" && reqStatus !== "rejected") {
      return res.status(400).send("Invalid status");
    }

    helpRequest.reqStatus = reqStatus;
    await helpRequest.save();

    if (reqStatus === "accepted") {
      const chatRoom = await ChatRoom.create({
        owner: req.user._id,
        name: helpRequest.name,
        status: helpRequest.status,
        location: helpRequest.location,
        schedule: helpRequest.schedule,
        subject: {
          subjectCode: helpRequest.subject.subjectCode,
          description: helpRequest.subject.description,
          subtopics: helpRequest.subject.subtopics,
        },
      });

      await ChatRoom.addParticipant(chatRoom._id, req.user._id, "owner");
      await ChatRoom.addParticipant(
        chatRoom._id,
        helpRequest.studentId._id,
        "accepted"
      );

      // Cancel other rooms where the user is a participant
      const userRooms = await ChatRoom.getUserRooms(helpRequest.studentId);
      for (const room of userRooms) {
        if (room._id.toString() !== chatRoom._id.toString()) {
          await ChatRoom.cancelParticipant(room._id, helpRequest.studentId._id);
          io.to(room._id).emit("participant-cancelled", {
            roomId: room._id,
            userId: helpRequest.studentId._id,
          });
        }
      }

      const updatedChatRoom = await ChatRoom.findById(chatRoom._id).populate(
        "participants.userId",
        "firstName lastName"
      );

      io.to(tuteeSocket).emit("request-accepted", {
        chatroom: updatedChatRoom,
        request: helpRequest,
      });
      res.send({ chatroom: updatedChatRoom, request: helpRequest });
    } else {
      io.to(tuteeSocket).emit("request-rejected", helpRequest);
      res.send(helpRequest);
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Error updating help request");
  }
};

const myRequests = async (req, res) => {
  try {
    const request = await HelpRequest.find({
      studentId: req.user._id,
      reqStatus: "pending",
    })
      .populate("tutorId", "firstName lastName")
      .populate("studentId", "firstName lastName");

    res.send(request);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching help requests");
  }
};

const deleteRequest = async (req, res) => {
  const { requestId } = req.params;

  try {
    const helpRequest = await HelpRequest.findById(requestId);

    if (!helpRequest) {
      return res.status(404).send("Help request not found");
    }

    if (helpRequest.studentId.toString() !== req.user._id.toString()) {
      return res.status(401).send("You are not authorized to remove this");
    }

    await helpRequest.remove();

    res.send("Help request deleted successfully");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error deleting help request");
  }
};

export { createRequest, myRequests, getRequests, acceptRequest, deleteRequest };
