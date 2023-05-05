import express from "express";
import { authAdmin } from "../middleware/auth.js";
import {
  getReportsAnalytics,
  getTopSearches,
} from "../controllers/analyticsControllers.js";

const analyticsRouter = express.Router();

// Get the analytics of report module
analyticsRouter.get("/api/analytics/reports", authAdmin, getReportsAnalytics);

analyticsRouter.get("/api/analytics/top-searches", authAdmin, getTopSearches);

export default analyticsRouter;
