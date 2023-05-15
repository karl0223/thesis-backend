import Report from "../../models/report.js";
import User from "../../models/user.js";
import Search from "../../models/search.js";

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

const getTopSearches = async (req, res) => {
  try {
    const topSearches = await Search.find()
      .sort({ count: -1 })
      .limit(10)
      .select("-_id term count");

    console.log("topSearches", topSearches);
    console.log(topSearches);
    return topSearches;
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
};

const getAllSearchTerms = async (req, res) => {
  try {
    const searches = await Search.find().select("-_id term count");
    res.json({ searches });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
};

async function getMostSearchedTutorAndSubject() {
  const searchTerms = await Search.aggregate([
    { $group: { _id: "$term", count: { $sum: "$count" } } },
  ]);

  const topSubject = await User.aggregate([
    { $unwind: "$subjects" },
    {
      $lookup: {
        from: "searches",
        let: { subjectCode: "$subjects.subjectCode" },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ["$term", "$$subjectCode"] },
            },
          },
          {
            $group: {
              _id: "$term",
              count: { $sum: "$count" },
            },
          },
        ],
        as: "searches",
      },
    },
    {
      $project: {
        _id: 0,
        firstName: 1,
        lastName: 1,
        subjectCode: "$subjects.subjectCode",
        description: "$subjects.description",
        subtopics: "$subjects.subtopics",
        searchCount: { $sum: "$searches.count" },
      },
    },
    { $sort: { searchCount: -1 } },
    { $limit: 10 },
  ]);

  const topTutor = await User.aggregate([
    {
      $lookup: {
        from: "searches",
        let: { firstName: "$firstName", lastName: "$lastName" },
        pipeline: [
          {
            $match: {
              $expr: {
                $or: [
                  {
                    $regexMatch: {
                      input: "$term",
                      regex: "$$firstName",
                      options: "i",
                    },
                  },
                  {
                    $regexMatch: {
                      input: "$term",
                      regex: "$$lastName",
                      options: "i",
                    },
                  },
                ],
              },
            },
          },
          {
            $group: {
              _id: "$term",
              count: { $sum: "$count" },
            },
          },
        ],
        as: "searches",
      },
    },
    {
      $project: {
        _id: 0,
        firstName: 1,
        lastName: 1,
        searchCount: { $sum: "$searches.count" },
      },
    },
    { $sort: { searchCount: -1 } },
    { $limit: 10 },
  ]);

  return {
    topSubject: topSubject,
    topTutor: topTutor,
  };
}

export {
  getReportsAnalytics,
  getTopSearches,
  getAllSearchTerms,
  getMostSearchedTutorAndSubject,
};
