import express from "express";
import { auth } from "../../middleware/auth.js";
import { webAuth, webAdminAuth } from "../../middleware/webAdminAuth.js";
import {
  getReportsAnalytics,
  getTopSearches,
  getAllSearchTerms,
  getMostSearchedTutorAndSubject,
} from "../../controllers/admin-controllers/analyticsControllers.js";

const analyticsRouter = express.Router();

analyticsRouter.get("/admin", webAuth, webAdminAuth, async (req, res) => {
  try {
    const topSearches = await getTopSearches();
    const { topTutor, topSubject } = await getMostSearchedTutorAndSubject();
    const context = {
      topSearches: JSON.stringify(topSearches),
      topTutor,
      topSubject,
    };

    res.render("analytics", context);
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
});

analyticsRouter.get(
  "/admin/analytics",
  webAuth,
  webAdminAuth,
  async (req, res) => {
    try {
      const topSearches = await getTopSearches();
      const { topTutor, topSubject } = await getMostSearchedTutorAndSubject();
      const context = {
        topSearches: JSON.stringify(topSearches),
        topTutor,
        topSubject,
      };

      res.render("analytics", context);
    } catch (error) {
      console.error(error);
      res.status(500).send("Server Error");
    }
  }
);

// Get the analytics of report module
// analyticsRouter.get(
//   "/api/analytics/reports",
//   webAuth,
//   webAdminAuth,
//   getReportsAnalytics
// );

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
  auth,
  async (req, res) => {
    try {
      const result = await getMostSearchedTutorAndSubject();
      res.json(result);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

export default analyticsRouter;
