import express from "express";
import { auth } from "../middleware/auth.js";
import {
  rateParticipants,
  rateTutor,
  clearRatings,
} from "../controllers/ratingControllers.js";

const ratingsRouter = new express.Router();

ratingsRouter.post("/api/rate-tutor", auth, rateTutor);

ratingsRouter.post("/api/rate-participants", auth, rateParticipants);

ratingsRouter.post("/api/clear-ratings/:userId", auth, clearRatings);

export default ratingsRouter;
