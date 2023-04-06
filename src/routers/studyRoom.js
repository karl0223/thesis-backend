import express from "express";
import { auth } from "../middleware/auth.js";
import {
  createChatRoom,
  getPublicRooms,
  getPrivateRooms,
  getMessages,
  getParticipants,
  sendMessage,
  sendInvite,
  acceptInvite,
} from "../controllers/studyRoomController.js";

const studyRoomRouter = express.Router();

studyRoomRouter.get("/api/studyroom", auth, getPublicRooms);

studyRoomRouter.get("/api/studyroom/private", auth, getPrivateRooms);

studyRoomRouter.get("/api/studyroom/:roomId", auth, getMessages);

studyRoomRouter.get(
  "/api/studyroom/:roomId/participants",
  auth,
  getParticipants
);

studyRoomRouter.post("/api/studyroom/create", auth, createChatRoom);

studyRoomRouter.post("/api/studyroom/messages", auth, sendMessage);

studyRoomRouter.post("/api/studyroom/invite", auth, sendInvite);

studyRoomRouter.post("/api/studyroom/accept", auth, acceptInvite);

export default studyRoomRouter;
