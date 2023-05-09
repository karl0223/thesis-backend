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

    io.to(tutorSocket).emit("new-request", newRequest);
    res.send(newRequest);
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

    const helpRequest = await HelpRequest.findById(requestId);

    const tuteeSocket = await getUserSocket(helpRequest.studentId);

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
            $elemMatch: { userId: helpRequest.studentId },
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
        helpRequest.studentId,
        "accepted"
      );

      // Cancel other rooms where the user is a participant
      const userRooms = await ChatRoom.getUserRooms(helpRequest.studentId);
      for (const room of userRooms) {
        if (room._id !== chatRoom._id) {
          await ChatRoom.cancelParticipant(room._id, helpRequest.studentId);
          io.to(room._id).emit("participant-cancelled", {
            roomId: room._id,
            userId: helpRequest.studentId,
          });
        }
      }

      io.to(tuteeSocket).emit("request-accepted", chatRoom);
      res.send(chatRoom);
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
    }).populate("tutorId", "firstName lastName");

    res.send(request);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching help requests");
  }
};

export { createRequest, myRequests, getRequests, acceptRequest };
