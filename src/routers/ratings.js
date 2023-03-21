import express from "express";
import { rateUser } from "../controllers/ratingControllers.js";
import { auth } from "../middleware/auth.js";

const ratingsRouter = express.Router();

// rate user - tutor or a tutee
ratingsRouter.post("/api/ratings/rate/:id", auth, rateUser);

export default ratingsRouter;
