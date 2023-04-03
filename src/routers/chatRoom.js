import express from "express";
import {
  createChatRoom,
  inviteUser,
  acceptInvitation,
  rejectInvitation,
  leaveChatRoom,
  promoteParticipant,
  demoteOwner,
  kickParticipant,
} from "./groupChatController.js";
import User from "../models/user.js";
import { auth } from "../middleware/auth.js";

const io = req.app.get("socketio");
