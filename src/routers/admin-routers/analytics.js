import express from "express";
import { authAdmin } from "../../middleware/auth.js";
import {
  getReportsAnalytics,
  getTopSearches,
  getAllSearchTerms,
  getMostSearchedTutorAndSubject,
} from "../../controllers/admin-controllers/analyticsControllers.js";

const analyticsRouter = express.Router();

// Get the analytics of report module
analyticsRouter.get("/api/analytics/reports", authAdmin, getReportsAnalytics);

analyticsRouter.get("/api/analytics/top-searches", authAdmin, getTopSearches);

analyticsRouter.get(
  "/api/analytics/get-all-search-terms",
  authAdmin,
  getAllSearchTerms
);

analyticsRouter.get(
  "/api/analytics/most-searched-tutor-subject",
  async (req, res) => {
    try {
      const result = await getMostSearchedTutorAndSubject();
      res.status(200).json(result);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

export default analyticsRouter;
