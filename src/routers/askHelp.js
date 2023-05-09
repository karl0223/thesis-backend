import express from "express";
import { auth } from "../middleware/auth.js";
import {
  createRequest,
  myRequests,
  getRequests,
  acceptRequest,
  deleteRequest,
} from "../controllers/askHelpControllers.js";

const helpRequestRouter = express.Router();

helpRequestRouter.get("/api/ask-help/my-requests", auth, myRequests);

helpRequestRouter.get("/api/ask-help/get-request", auth, getRequests);

helpRequestRouter.post("/api/ask-help/request/:tutorId", auth, createRequest);

helpRequestRouter.post(
  "/api/ask-help/accept-request/:requestId/:reqStatus",
  auth,
  acceptRequest
);

helpRequestRouter.delete(
  "/api/ask-help/delete-request/:requestId",
  auth,
  deleteRequest
);

export default helpRequestRouter;
