import User from "../models/user.js";

const addSubject = async (req, res) => {
  const { subjectCode, description, subtopics } = req.body;
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).send({ error: "User not found" });
    }
    if (user.role !== "tutor") {
      return res
        .status(401)
        .send({ error: "Only tutors are allowed to add subjects" });
    }
    const subject = {
      subjectCode,
      description,
      subtopics,
    };
    user.subjects.push(subject);
    await user.save();
    res.send({ message: "Subject added successfully" });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};

export { addSubject };
