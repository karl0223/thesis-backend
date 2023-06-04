import Report from "../../models/report.js";
import User from "../../models/user.js";
import { getReportsAnalytics } from "./analyticsControllers.js";
import { getUserSocket } from "../../utils/socketUtils.js";

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
    const io = req.app.get("socketio");
    const report = new Report({
      reporter: req.user._id,
      reportedUser,
      content,
      category,
    });
    await report.save();

    const reportedUserSocket = await getUserSocket(reportedUser);
    io.to(reportedUserSocket).emit("new-report", report);

    res.status(201).json(report);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

const updateReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const io = req.app.get("socketio");

    let report;
    if (status === "dismissed" || status === "resolved") {
      report = await Report.findByIdAndUpdate(id, { status }, { new: true });
      if (!report) {
        return res.status(404).json({ message: "Report not found" });
      }
    } else {
      return res.status(400).json({ message: "Invalid status" });
    }

    if (status === "resolved") {
      await User.findByIdAndUpdate(
        report.reportedUser._id,
        { isBanned: true, tokens: [] },
        { new: true }
      );
    }

    const reporterSocket = await getUserSocket(report.reporter._id);
    const reportedUserSocket = await getUserSocket(report.reportedUser._id);

    io.to(reporterSocket).emit("report-result", report);
    io.to(reportedUserSocket).emit("report-result", report);

    return res.status(200).json(report);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

export { getAllReports, reportUser, updateReport };
