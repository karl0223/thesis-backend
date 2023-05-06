import express from "express";
import { auth } from "../middleware/auth.js";
import { rateParticipants, rateTutor } from "../controllers/rateController.js";

const rateRouter = new express.Router();

rateRouter.post("/api/rate-tutor", auth, rateTutor);

rateRouter.post("/api/rate-participants", auth, rateParticipants);

export default rateRouter;
