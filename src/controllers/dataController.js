import User from "../models/user.js";

const getAllTutors = async (req, res) => {
  const { page: rawPage = 1, limit: rawLimit = 10 } = req.query;

  const page = parseInt(rawPage, 10);
  const limit = parseInt(rawLimit, 10);

  const totalTutors = await User.countDocuments({ role: "tutor" });
  const totalPages = Math.ceil(totalTutors / limit);

  if (page > totalPages) {
    return res.status(400).json({ message: "Page out of range" });
  }

  const tutors = await User.find({ role: "tutor" })
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
