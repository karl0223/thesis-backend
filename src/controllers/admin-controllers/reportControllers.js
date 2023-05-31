import Report from "../../models/report.js";
import { getReportsAnalytics } from "./analyticsControllers.js";

const getAllReports = async (req, res) => {
  try {
    const reportData = await getReportsAnalytics();
    const reports = await Report.find()
      .populate("reporter", "firstName lastName")
      .populate("reportedUser", "firstName lastName")
      .lean();

    // Format the date for each report
    reports.forEach((report) => {
      report.formattedDate = new Date(report.date).toLocaleString();
    });

    res.render("reports", { reports, reportData: JSON.stringify(reportData) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Create a new report
const reportUser = async (req, res) => {
  try {
    const { reportedUser, content, category } = req.body;
    const report = new Report({
      reporter: req.user._id,
      reportedUser,
      content,
      category,
    });
    await report.save();
    res.status(201).json(report);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Update status report (admin)
const updateReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const report = await Report.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );
    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }
    res.status(200).json(report);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export { getAllReports, reportUser, updateReport };
