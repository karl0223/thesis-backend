import express from "express";
import { webAuth, webAdminAuth } from "../../middleware/webAdminAuth.js";
import {
  getReportsAnalytics,
  getTopSearches,
  getAllSearchTerms,
  getMostSearchedTutorAndSubject,
} from "../../controllers/admin-controllers/analyticsControllers.js";

const analyticsRouter = express.Router();

analyticsRouter.get(
  "/admin/analytics",
  webAuth,
  webAdminAuth,
  async (req, res) => {
    var topSearches = await getTopSearches();
    const context = {
      topSearches: JSON.stringify(topSearches),
    };
    console.log("context", context);

    res.render("analytics", context);

    //sample: res.render("analytics", { mostSearch, topSearch, allSearch });
  }
);

// Get the analytics of report module
analyticsRouter.get(
  "/api/analytics/reports",
  webAuth,
  webAdminAuth,
  getReportsAnalytics
);

analyticsRouter.get(
  "/api/analytics/top-searches",
  webAuth,
  webAdminAuth,
  getTopSearches
);

analyticsRouter.get(
  "/api/analytics/get-all-search-terms",
  webAuth,
  webAdminAuth,
  getAllSearchTerms
);

analyticsRouter.get(
  "/api/analytics/most-searched-tutor-subject",
  webAuth,
  webAdminAuth,
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
