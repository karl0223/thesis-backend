import User from "../models/user.js";
import purify from "../utils/domPurify.js";

const getAllTutors = async (req, res) => {
  const { page: rawPage = 1, limit: rawLimit = 10, search } = req.query;

  const page = parseInt(rawPage, 10);
  const limit = parseInt(rawLimit, 10);

  let query = { role: "tutor" };

  if (search) {
    const sanitizedSearch = purify.sanitize(search);
    const searchRegex = new RegExp(sanitizedSearch, "i");
    query.$or = [
      { firstName: searchRegex },
      { lastName: searchRegex },
      { "subjects.subjectCode": searchRegex },
      { "subjects.description": searchRegex },
      { "subjects.subtopics.name": searchRegex },
      { "subjects.subtopics.description": searchRegex },
    ];
  }

  console.log(search);
  console.log(query);

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
