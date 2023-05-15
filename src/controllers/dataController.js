import User from "../models/user.js";
import purify from "../utils/domPurify.js";
import { normalizeText, termCounts } from "../utils/searchUtils.js";

const getAllTutors = async (req, res) => {
  const { page: rawPage = 1, limit: rawLimit = 10, search } = req.query;

  const page = parseInt(rawPage, 10);
  const limit = parseInt(rawLimit, 10);

  let query = {
    role: "tutor",
    "subjects.0.subjectCode": { $exists: true },
    isAvailable: true,
  };

  if (search) {
    const sanitizedSearch = purify.sanitize(search);
    const searchTerms = sanitizedSearch.split(/\s+/);

    termCounts(searchTerms);

    const searchRegexes = searchTerms.map(
      (term) => new RegExp(normalizeText(term), "i")
    );

    query.$or = [
      { firstName: { $in: searchRegexes } },
      { lastName: { $in: searchRegexes } },
      { "subjects.subjectCode": { $in: searchRegexes } },
      { "subjects.description": { $in: searchRegexes } },
      { "subjects.subtopics.name": { $in: searchRegexes } },
      { "subjects.subtopics.description": { $in: searchRegexes } },
    ];
  }

  const totalTutors = await User.countDocuments(query);
  const totalPages = Math.ceil(totalTutors / limit);

  if (page > totalPages) {
    return res.status(400).json({
      message: "Page out of range",
      tutors: [],
      currentPage: page,
      totalPages: 0,
      totalTutors: 0,
    });
  }

  const tutors = await User.find(query)
    .skip((page - 1) * limit)
    .limit(limit);

  res.json({ tutors, currentPage: page, totalPages, totalTutors });
};

const getAllTutees = async (req, res) => {
  const { page: rawPage = 1, limit: rawLimit = 10 } = req.query;

  const page = parseInt(rawPage, 10);
  const limit = parseInt(rawLimit, 10);

  const totalTutees = await User.countDocuments({ role: "tutee" });
  const totalPages = Math.ceil(totalTutees / limit);

  if (page > totalPages) {
    return res.status(400).json({ message: "Page out of range" });
  }

  const tutee = await User.find({ role: "tutee" })
    .skip((page - 1) * limit)
    .limit(limit);

  res.json({ tutee, currentPage: page, totalPages, totalTutees });
};

export { getAllTutors, getAllTutees };
