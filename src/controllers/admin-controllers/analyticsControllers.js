import Report from "../../models/report.js";
import User from "../../models/user.js";
import Search from "../../models/search.js";
import { computerScience } from "../../utils/subjectsUtils.js";

function searchSubjects(subjects, searchTerm) {
  // Convert the search term to lowercase for case-insensitive search
  const searchLowerCase = searchTerm.toLowerCase();

  // Create a Set to store unique subjects
  const uniqueSubjects = new Set();

  // Iterate over each subject and check for a match
  subjects.forEach((subject) => {
    const { subjectCode, description } = subject;

    // Convert subject code and description to lowercase for comparison
    const subjectCodeLowerCase = subjectCode.toLowerCase();
    const descriptionLowerCase = description.toLowerCase();

    // Check if subject code or description contains the search term
    if (
      subjectCodeLowerCase.includes(searchLowerCase) ||
      descriptionLowerCase.includes(searchLowerCase)
    ) {
      // Add the subject to the unique subjects Set
      uniqueSubjects.add(subject);
    }
  });

  // Convert the unique subjects Set back to an array
  const uniqueSubjectsArray = Array.from(uniqueSubjects);

  return uniqueSubjectsArray;
}

// Get the analytics of report module (admin)
const getReportsAnalytics = async () => {
  // Calculate the total number of reports
  const totalReports = await Report.countDocuments();

  // Calculate the number of reports by category
  const spamReports = await Report.countDocuments({ category: "spam" });
  const harassmentReports = await Report.countDocuments({
    category: "harassment",
  });
  const inappropriateContentReports = await Report.countDocuments({
    category: "inappropriate content",
  });
  const otherReports = await Report.countDocuments({ category: "other" });

  // Calculate the number of resolved and pending reports
  const resolvedReports = await Report.countDocuments({ status: "resolved" });
  const pendingReports = await Report.countDocuments({ status: "pending" });
  const dismissedReports = await Report.countDocuments({ status: "dismissed" });

  // Return the analytics data as JSON
  const reportData = {
    totalReports,
    spamReports,
    harassmentReports,
    inappropriateContentReports,
    otherReports,
    resolvedReports,
    pendingReports,
    dismissedReports,
  };

  return reportData;
};

const getTopSearches = async (req, res) => {
  try {
    const topSearches = await Search.find()
      .sort({ count: -1 })
      .limit(10)
      .select("-_id term count");

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

  const results = []; // Array to store the results
  const subjectCollection = {}; // Object to store the subject collection

  for (let i = 0; i < searchTerms.length; i++) {
    const topSubjectTerm = searchTerms[i]._id;
    const topSubject = searchSubjects(computerScience, topSubjectTerm);

    for (const subject of topSubject) {
      const subjectCode = subject.subjectCode;
      const description = subject.description;

      // Create a unique key for each subject using subjectCode and description
      const subjectKey = `${subjectCode}-${description}`;

      // Increment the search count or initialize it to 0 if not present
      subjectCollection[subjectKey] =
        (subjectCollection[subjectKey] || 0) + searchTerms[i].count;
    }
  }

  // Convert the subject collection object into an array of objects
  for (const subjectKey in subjectCollection) {
    if (subjectCollection.hasOwnProperty(subjectKey)) {
      const [subjectCode, description] = subjectKey.split("-");
      const searchCount = subjectCollection[subjectKey];
      results.push({ subjectCode, description, searchCount });
    }
  }

  // Convert the subject collection object into an array of objects
  const sortedResults = Object.keys(subjectCollection)
    .map((subjectKey) => {
      const [subjectCode, description] = subjectKey.split("-");
      const searchCount = subjectCollection[subjectKey];
      return { subjectCode, description, searchCount };
    })
    .sort((a, b) => b.searchCount - a.searchCount)
    .slice(0, 15);

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
    topSubject: sortedResults,
    topTutor: topTutor,
  };
}

// // Get the analytics of report module (admin)
// const getReportsAnalytics = async (req, res) => {
//   try {
//     // Calculate the total number of reports
//     const totalReports = await Report.countDocuments();

//     // Calculate the number of reports by category
//     const spamReports = await Report.countDocuments({ category: "spam" });
//     const harassmentReports = await Report.countDocuments({
//       category: "harassment",
//     });
//     const inappropriateReports = await Report.countDocuments({
//       category: "inappropriate content",
//     });
//     const otherReports = await Report.countDocuments({ category: "other" });

//     // Calculate the number of resolved and pending reports
//     const resolvedReports = await Report.countDocuments({ status: "resolved" });
//     const pendingReports = await Report.countDocuments({ status: "pending" });

//     // Return the analytics data as JSON
//     res.status(200).json({
//       totalReports,
//       spamReports,
//       harassmentReports,
//       inappropriateReports,
//       otherReports,
//       resolvedReports,
//       pendingReports,
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Server error" });
//   }
// };

export {
  getReportsAnalytics,
  getTopSearches,
  getAllSearchTerms,
  getMostSearchedTutorAndSubject,
};
