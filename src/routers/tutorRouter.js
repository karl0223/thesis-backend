import express from "express";
import { auth } from "../middleware/auth.js";
import { addSubject } from "../controllers/tutorController.js";

const tutorRouter = express.Router();

tutorRouter.post("/api/tutor/add-subject", auth, addSubject);

export default tutorRouter;
