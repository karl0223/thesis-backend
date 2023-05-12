import express from "express";
import { auth } from "../middleware/auth.js";
import {
  joinRoom,
  createChatRoom,
  leaveChatRoom,
  acceptUserRequest,
  getOwnerRoomPendingParticipants,
  getPendingChatRoom,
  getUserChatRooms,
  getPublicRooms,
  getPrivateRooms,
  getMessages,
  getParticipants,
  pendingParticipants,
  sendMessage,
  sendInvite,
  acceptInvite,
  kickParticipant,
  kickAllParticipants,
  sessionEnded,
} from "../controllers/studyRoomController.js";

const studyRoomRouter = express.Router();

// owner room
studyRoomRouter.get(
  "/api/studyroom/pending-participant-in-owner-room/:roomId",
  auth,
  getOwnerRoomPendingParticipants
);

studyRoomRouter.get("/api/studyroom/pending", auth, getPendingChatRoom);

studyRoomRouter.get("/api/studyroom/public", auth, getPublicRooms);

studyRoomRouter.get("/api/studyroom/private", auth, getPrivateRooms);

studyRoomRouter.get("/api/studyroom/messages/:roomId", auth, getMessages);

studyRoomRouter.get(
  "/api/studyroom/:roomId/participants",
  auth,
  getParticipants
);

studyRoomRouter.get(
  "/api/studyroom/:roomId/pending-participants",
  auth,
  pendingParticipants
);

studyRoomRouter.get("/api/studyroom/user-room", auth, getUserChatRooms);

studyRoomRouter.post("/api/studyroom/join/:roomId", auth, joinRoom);

studyRoomRouter.post("/api/studyroom/create", auth, createChatRoom);

studyRoomRouter.post("/api/studyroom/messages", auth, sendMessage);

studyRoomRouter.post("/api/studyroom/invite", auth, sendInvite);

studyRoomRouter.post("/api/studyroom/accept", auth, acceptInvite);

studyRoomRouter.post(
  "/api/studyroom/kick-all/:roomId",
  auth,
  kickAllParticipants
);

studyRoomRouter.post(
  "/api/studyroom/kick/:roomId/:userId",
  auth,
  kickParticipant
);

studyRoomRouter.post("/api/studyroom/leave/:roomId", auth, leaveChatRoom);

studyRoomRouter.patch(
  "/api/studyroom/accept-participant/:roomId/:userId/:status",
  auth,
  acceptUserRequest
);

studyRoomRouter.patch("/api/studyroom/end-session/:roomId", auth, sessionEnded);

export default studyRoomRouter;
