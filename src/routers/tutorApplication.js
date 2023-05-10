import express from "express";
import multer from "multer";
import { auth, authAdmin } from "../middleware/auth.js";
import {
  changeRole,
  getApplication,
  getTutorApplicationCount,
  getAllTutorApplications,
  getTutorApplicationById,
  createTutorApplication,
  updateTutorApplication,
  deleteTutorApplication,
  approveTutorApplication,
  rejectTutorApplication,
  getUploadedImage,
} from "../controllers/tutorApplicationControllers.js";

const tutorApplicationRouter = express.Router();

// To do
// get my application
// update the user's role if acceptedd --DONE
// delete user's application if rejected -- DONE
// create check application route

// change tutor role to tutee - for testing
tutorApplicationRouter.patch(
  "/api/tutor-application/change-role",
  auth,
  changeRole
);

// total count of submitted tutor application
tutorApplicationRouter.get(
  "/api/tutor-application/count",
  authAdmin,
  getTutorApplicationCount
);

// Get user application
tutorApplicationRouter.get("/api/tutor-application/me", auth, getApplication);

// Get all tutor using controller
tutorApplicationRouter.get(
  "/api/tutor-application",
  authAdmin,
  getAllTutorApplications
);

// Get a single tutor application by ID (admin)
tutorApplicationRouter.get(
  "/api/tutor-application/:id",
  authAdmin,
  getTutorApplicationById
);

// Accept tutor application (admin)
tutorApplicationRouter.patch(
  "/api/tutor-application/:id/approve",
  authAdmin,
  approveTutorApplication
);

// Reject tutor application (admin)
tutorApplicationRouter.delete(
  "/api/tutor-application/:id/rejected",
  authAdmin,
  rejectTutorApplication
);

// Create a new tutor application
tutorApplicationRouter.post(
  "/api/tutor-application/create",
  auth,
  createTutorApplication
);

// Update an existing tutor application
tutorApplicationRouter.patch(
  "/api/tutor-application/update",
  auth,
  updateTutorApplication
);

// Delete an existing tutor application
tutorApplicationRouter.delete(
  "/api/tutor-application/delete",
  auth,
  deleteTutorApplication
);

// Route to get the uploaded image for a tutor application
tutorApplicationRouter.get(
  "/api/tutor-application/:id/image",
  getUploadedImage
);

export default tutorApplicationRouter;
