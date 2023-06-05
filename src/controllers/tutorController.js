import User from "../models/user.js";
import { separateData, filterSubjectData } from "../utils/gradesData.js";
import { ocrSpace } from "ocr-space-api-wrapper";

const addSubject = async (req, res) => {
  try {
    const { image } = req.body;

    const imageData = await ocrSpace(image, {
      apiKey: process.env.OCR_API_KEY,
      scale: true,
      isTable: true,
      OCREngine: 2,
    });

    if (
      !imageData ||
      imageData.IsErroredOnProcessing ||
      !imageData.ParsedResults ||
      imageData.ParsedResults.length === 0 ||
      !imageData.ParsedResults[0].ParsedText
    ) {
      return res
        .status(500)
        .send("Error processing image or no text detected.");
    }

    const parsedText = imageData.ParsedResults[0].ParsedText;
    const rawData = separateData(parsedText);
    const subjects = filterSubjectData(rawData);

    if (subjects.length === 0) {
      return res.status(500).send("Please Upload a better quality picture.");
    }

    const user = await User.findById(req.user._id);

    // Add each subject code and description from the tutor application to user's subjects
    for (const subject of subjects) {
      const { subjectCode, description } = subject;

      // Check if the subject already exists in user's subjects
      const isSubjectExist = user.subjects.some(
        (subject) =>
          subject.subjectCode === subjectCode &&
          subject.description === description
      );

      if (!isSubjectExist) {
        user.subjects.push({ subjectCode, description });
      }
    }

    await user.save();

    res.send("Subjects added successfully");
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// const addSubject = async (req, res) => {
//   const { subjectCode, description, subtopics } = req.body;
//   try {
//     const user = await User.findById(req.user._id);
//     if (!user) {
//       return res.status(404).send({ error: "User not found" });
//     }
//     if (user.role !== "tutor") {
//       return res
//         .status(401)
//         .send({ error: "Only tutors are allowed to add subjects" });
//     }
//     const subject = {
//       subjectCode,
//       description,
//       subtopics,
//     };
//     user.subjects.push(subject);
//     await user.save();
//     res.send({ message: "Subject added successfully" });
//   } catch (error) {
//     res.status(500).send({ error: error.message });
//   }
// };

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
