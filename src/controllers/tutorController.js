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

// Update subject by subject code
const updateSubject = async (req, res) => {
  const { subjectCode } = req.params;
  const { description, subtopics } = req.body;
  try {
    const user = await User.findOneAndUpdate(
      {
        _id: req.user._id,
        "subjects.subjectCode": subjectCode,
      },
      {
        $set: {
          "subjects.$.description": description,
          "subjects.$.subtopics": subtopics,
        },
      }
    );
    if (!user) {
      return res.status(404).send({ error: "Subject not found" });
    }
    res.send({ message: "Subject updated successfully" });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};

// Delete subject by subject code
const deleteSubject = async (req, res) => {
  const { subjectCode } = req.params;
  try {
    const user = await User.findOneAndUpdate(
      {
        _id: req.user._id,
        "subjects.subjectCode": subjectCode,
      },
      {
        $pull: {
          subjects: { subjectCode: subjectCode },
        },
      }
    );
    if (!user) {
      return res.status(404).send({ error: "Subject not found" });
    }
    res.send({ message: "Subject deleted successfully" });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};

export { addSubject, updateSubject, deleteSubject };
