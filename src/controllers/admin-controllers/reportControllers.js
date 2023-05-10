import Report from "../../models/report.js";

// Get all reports (admin)
const getAllReports = async (req, res) => {
  try {
    const reports = await Report.find();
    res.status(200).json(reports);
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
