const TutorApplication = require("../models/tutorApplication");
const User = require("../models/user");

const getTutorApplications = async (req, res) => {
  try {
    const tutorApplications = await TutorApplication.find().populate(
      "userId",
      "firstName"
    );
    res.json(tutorApplications);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

const getTutorApplicationById = async (req, res) => {
  try {
    const tutorApplication = await TutorApplication.findById(
      req.params.id
    ).populate("userId", "-password");
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
  const { briefIntro, teachingExperience } = req.body;

  try {
    // check if the user has sent an application
    const existingApplication = await TutorApplication.findOne({
      userId: req.user._id,
    });

    if (existingApplication) {
      return res.status(409).send("Application already submitted.");
    }

    const tutorApplication = new TutorApplication({
      userId: req.user._id,
      grades: {
        data: req.file.buffer,
        contentType: req.file.mimetype,
      },
      briefIntro,
      teachingExperience,
    });

    await tutorApplication.save();

    res.json(tutorApplication);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

const updateTutorApplication = async (req, res) => {
  const { grades, briefIntro, teachingExperience } = req.body;

  try {
    let tutorApplication = await TutorApplication.findOne({
      userId: req.user._id,
    });

    if (!tutorApplication) {
      return res.status(404).json({ msg: "Tutor application not found" });
    }

    tutorApplication.grades = grades;
    tutorApplication.briefIntro = briefIntro;
    tutorApplication.teachingExperience = teachingExperience;

    await tutorApplication.save();

    res.json(tutorApplication);
  } catch (err) {
    console.error(err.message);
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
    const tutorApplication = await TutorApplication.findById(req.params.id);

    tutorApplication.status = "accepted";

    const updateRole = await User.findByIdAndUpdate(
      tutorApplication.userId,
      { role: "tutor" },
      { new: true }
    );

    await tutorApplication.save();
    await updateRole.save();

    res.status(200).json({
      success: true,
      message: "Tutor application approved successfully!",
      data: {
        tutorApplication,
        updateRole,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

module.exports = router;
