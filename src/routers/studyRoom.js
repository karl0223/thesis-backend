import express from "express";
import { auth } from "../middleware/auth.js";
import {
  joinRoom,
  createChatRoom,
  allRequestedRooms,
  getPublicRooms,
  getPrivateRooms,
  getMessages,
  getParticipants,
  sendMessage,
  sendInvite,
  acceptInvite,
} from "../controllers/studyRoomController.js";

const studyRoomRouter = express.Router();

studyRoomRouter.get("/api/studyroom", auth, allRequestedRooms);

studyRoomRouter.get("/api/studyroom/public", auth, getPublicRooms);

studyRoomRouter.get("/api/studyroom/private", auth, getPrivateRooms);

studyRoomRouter.get("/api/studyroom/:roomId", auth, getMessages);

studyRoomRouter.get(
  "/api/studyroom/:roomId/participants",
  auth,
  getParticipants
);

studyRoomRouter.post("/api/studyroom/join/:roomId", auth, joinRoom);

studyRoomRouter.post("/api/studyroom/create", auth, createChatRoom);

studyRoomRouter.post("/api/studyroom/messages", auth, sendMessage);

studyRoomRouter.post("/api/studyroom/invite", auth, sendInvite);

studyRoomRouter.post("/api/studyroom/accept", auth, acceptInvite);

export default studyRoomRouter;
