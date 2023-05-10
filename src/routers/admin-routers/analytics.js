import express from "express";
import { authAdmin } from "../../middleware/auth.js";
import {
  getReportsAnalytics,
  getTopSearches,
  getAllSearchTerms,
  getMostSearchedTutorAndSubject,
} from "../../controllers/admin-controllers/analyticsControllers.js";

const analyticsRouter = express.Router();

analyticsRouter.get("/admin/analytics", authAdmin, (req, res) => {
  // shows the UI then pass all the values here to show the charts
  res.render("analytics", {} /*, { values }*/);

  //sample: res.render("analytics", { mostSearch, topSearch, allSearch });
});

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
      res.render("analytics", { result });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

export default analyticsRouter;
