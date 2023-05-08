import express from "express";
import { auth } from "../middleware/auth.js";
import {
  addSubject,
  updateSubject,
  deleteSubject,
} from "../controllers/tutorController.js";

const tutorRouter = express.Router();

tutorRouter.post("/api/tutor/add-subject", auth, addSubject);

tutorRouter.post("/api/tutor/update-subject/:subjectCode", auth, updateSubject);

tutorRouter.delete(
  "/api/tutor/delete-subject/:subjectCode",
  auth,
  deleteSubject
);

export default tutorRouter;
