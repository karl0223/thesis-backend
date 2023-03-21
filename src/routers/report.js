import express from "express";
import {
  getAllReports,
  reportUser,
  updateReport,
} from "../controllers/reportControllers.js";
import { auth, authAdmin } from "../middleware/auth.js";

const reportRouter = express.Router();

// Get all reports (admin)
reportRouter.get("/api/reports", authAdmin, getAllReports);

// update report status (admin)
reportRouter.put("/api/reports/:id", authAdmin, updateReport);

// report user
reportRouter.post("/api/reports", auth, reportUser);

export default reportRouter;
