import User from "../models/user.js";

const getAllTutors = async (req, res) => {
  const tutors = await User.find({ role: "tutor" });

  res.json(tutors);
};

const getAllTutees = async (req, res) => {
  const tutee = await User.find({ role: "tutee" });

  res.json(tutee);
};

export { getAllTutors, getAllTutees };
