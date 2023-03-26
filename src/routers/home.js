import express from "express";
import { auth } from "../middleware/auth.js";
import { getAllTutees, getAllTutors } from "../controllers/dataController.js";

const homeRouter = express.Router();

homeRouter.get("/home/tutors", auth, getAllTutors);

homeRouter.get("/home/tutees", auth, getAllTutees);

export default homeRouter;
