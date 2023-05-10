import express from "express";
import {
  getAllReports,
  reportUser,
  updateReport,
} from "../../controllers/admin-controllers/reportControllers.js";
import { auth, authAdmin } from "../../middleware/auth.js";

const reportRouter = express.Router();

// Get all reports (admin)
reportRouter.get("/admin/reports", authAdmin, getAllReports);

// update report status (admin)
reportRouter.put("/admin/reports/:id", authAdmin, updateReport);

// report user
reportRouter.post("/admin/reports", auth, reportUser);

export default reportRouter;
