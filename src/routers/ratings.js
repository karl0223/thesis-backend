import express from "express";
const ratingsRouter = express.Router();
import { rateUser } from "../controllers/ratingControllers.js";
import { auth } from "../middleware/auth.js";

// rate user - tutor or a tutee
ratingsRouter.post("/api/ratings/rate/:id", auth, rateUser);

export default ratingsRouter;
