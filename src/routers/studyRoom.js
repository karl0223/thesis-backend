import express from "express";
import { auth } from "../middleware/auth.js";
import {
  getPublicRooms,
  getPrivateRooms,
} from "../controllers/studyRoomController.js";

const studyRoomRouter = express.Router();

studyRoomRouter.get("/api/studyroom", auth, getPublicRooms);

studyRoomRouter.get("/api/studyroom/private", auth, getPrivateRooms);

export default studyRoomRouter;
