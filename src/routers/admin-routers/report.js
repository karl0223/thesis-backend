import express from "express";
import {
  getAllReports,
  reportUser,
  updateReport,
} from "../../controllers/admin-controllers/reportControllers.js";
import { auth } from "../../middleware/auth.js";
import { webAuth, webAdminAuth } from "../../middleware/webAdminAuth.js";

const reportRouter = express.Router();

// Get all reports (admin)
reportRouter.get("/admin/reports", webAuth, webAdminAuth, getAllReports);

// update report status (admin)
reportRouter.put("/admin/reports/:id", webAuth, webAdminAuth, updateReport);

// report user
reportRouter.post("/admin/reports", auth, reportUser);

export default reportRouter;
