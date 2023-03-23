import Report from "../models/report.js";

// Get the analytics of report module (admin)
const getReportsAnalytics = async (req, res) => {
  try {
    // Calculate the total number of reports
    const totalReports = await Report.countDocuments();

    // Calculate the number of reports by category
    const spamReports = await Report.countDocuments({ category: "spam" });
    const harassmentReports = await Report.countDocuments({
      category: "harassment",
    });
    const inappropriateReports = await Report.countDocuments({
      category: "inappropriate content",
    });
    const otherReports = await Report.countDocuments({ category: "other" });

    // Calculate the number of resolved and pending reports
    const resolvedReports = await Report.countDocuments({ status: "resolved" });
    const pendingReports = await Report.countDocuments({ status: "pending" });

    // Return the analytics data as JSON
    res.status(200).json({
      totalReports,
      spamReports,
      harassmentReports,
      inappropriateReports,
      otherReports,
      resolvedReports,
      pendingReports,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export { getReportsAnalytics };
