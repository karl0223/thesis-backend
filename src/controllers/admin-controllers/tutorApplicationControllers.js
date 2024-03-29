import TutorApplication from "../../models/tutorApplication.js";
import User from "../../models/user.js";
import { getUserSocket } from "../../utils/socketUtils.js";
import { separateData, filterSubjectData } from "../../utils/gradesData.js";
import { ocrSpace } from "ocr-space-api-wrapper";
import sendPushNotification from "../../utils/firebase-notification.js";

const changeRole = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    user.role = "tutee";

    user.save();

    res.json(user);
  } catch (err) {
    console(err);
    res.status(500).send("Server Error");
  }
};

// count all tutor applications submitted
const getTutorApplicationCount = async (req, res) => {
  try {
    const count = await TutorApplication.countDocuments();
    res.json({ count });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// under construction
const getApplication = async (req, res) => {
  try {
    const tutorApplication = await TutorApplication.findOne({
      userId: req.user._id,
      status: "pending",
    });

    if (!tutorApplication) {
      return res.status(404).json({ msg: "Tutor application not found" });
    }

    res.json(tutorApplication);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

const getAllTutorApplications = async (req, res) => {
  try {
    const tutorApplications = await TutorApplication.find({
      status: "pending",
    }).populate("userId", "firstName lastName email");

    const context = {
      applications: JSON.stringify(tutorApplications),
    };

    res.render("pending_tutors", context);

    //es.json({ tutorApplications, totalCount: count });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

const getTutorApplicationById = async (req, res) => {
  try {
    const tutorApplication = await TutorApplication.findById(req.params.id);
    if (!tutorApplication) {
      return res.status(404).json({ msg: "Tutor application not found" });
    }

    res.json(tutorApplication);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

const createTutorApplication = async (req, res) => {
  const { image, briefIntro, teachingExperience } = req.body;

  try {
    // check if the user has sent an application
    const existingApplication = await TutorApplication.findOne({
      userId: req.user._id,
    });

    if (existingApplication) {
      return res.status(409).send("Application already submitted.");
    }

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
    const subject = filterSubjectData(rawData);

    if (subject.length === 0) {
      return res
        .status(500)
        .send("Error processing image or no text detected.");
    }

    const tutorApplication = new TutorApplication({
      userId: req.user._id,
      grades: image,
      briefIntro,
      teachingExperience,
      subject, // Pass the subjects array directly
    });

    await tutorApplication.save();

    res.json(tutorApplication);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

const updateTutorApplication = async (req, res) => {
  const { image, briefIntro, teachingExperience, subject } = req.body;

  try {
    // Find the TutorApplication document to be updated
    const tutorApplication = await TutorApplication.findOne({
      userId: req.user._id,
    });

    if (!tutorApplication) {
      return res.status(404).send("Tutor application not found.");
    }

    // Update the grades field with the new data
    tutorApplication.grades = image;

    // Update the other fields
    tutorApplication.briefIntro = briefIntro;
    tutorApplication.teachingExperience = teachingExperience;
    tutorApplication.subject = subject;

    await tutorApplication.save();

    res.json(tutorApplication);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

const rejectTutorApplication = async (req, res) => {
  try {
    const io = req.app.get("socketio");
    const tutorApplication = await TutorApplication.findOneAndUpdate(
      { _id: req.params.id },
      { status: "rejected" },
      { new: true }
    );

    if (!tutorApplication) {
      return res.status(404).send("Tutor application not found");
    }

    var userSocket = await getUserSocket(tutorApplication.userId);
    if (userSocket) {
      io.emit("tutor-application-rejected", tutorApplication);
    }

    tutorApplication.remove();

    const user = await User.findById(tutorApplication.userId);

    sendPushNotification(
      user.devices,
      "Tutor Application Rejected",
      "Your tutor application has been rejected."
    );

    res.redirect("/admin/tutor-application");
  } catch (err) {
    console.log(err.message);
    res.status(500).send("Server Error");
  }
};

const deleteTutorApplication = async (req, res) => {
  try {
    const tutorApplication = await TutorApplication.findOne({
      userId: req.user._id,
    });

    if (!tutorApplication) {
      return res.status(404).json({ msg: "Tutor application not found" });
    }

    await tutorApplication.remove();

    res.json({ msg: "Tutor application removed" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

const approveTutorApplication = async (req, res) => {
  try {
    const io = req.app.get("socketio");
    const tutorApplication = await TutorApplication.findById(req.params.id);

    tutorApplication.status = "approved";

    const updateRole = await User.findByIdAndUpdate(
      tutorApplication.userId,
      { role: "tutor" },
      { new: true }
    );

    // Add each subject code and description from the tutor application to user's subjects
    for (const subject of tutorApplication.subject) {
      const { subjectCode, description } = subject;

      updateRole.subjects.push({ subjectCode, description });
    }

    await tutorApplication.save();
    await updateRole.save();

    var userSocket = await getUserSocket(tutorApplication.userId);
    if (userSocket) {
      io.emit("tutor-application-approved", tutorApplication);
    }

    const user = await User.findById(tutorApplication.userId);

    sendPushNotification(
      user.devices,
      "Your Application has been approved",
      "Congratulations! You are now a tutor."
    );

    res.redirect("/admin/tutor-application");
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

const getUploadedImage = async (req, res) => {
  try {
    const tutorApplication = await TutorApplication.findById(req.params.id);

    if (!tutorApplication) {
      return res.status(404).send("Tutor application not found.");
    }

    res.send(tutorApplication.grades);
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
};

export {
  changeRole,
  getApplication,
  getTutorApplicationCount,
  getAllTutorApplications,
  getTutorApplicationById,
  createTutorApplication,
  updateTutorApplication,
  deleteTutorApplication,
  approveTutorApplication,
  rejectTutorApplication,
  getUploadedImage,
};
