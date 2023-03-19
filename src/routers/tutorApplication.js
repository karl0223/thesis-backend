const express = require("express");
const router = express.Router();
const multer = require("multer");
const User = require("../models/user");
const { auth, authAdmin } = require("../middleware/auth");
const TutorApplication = require("../models/tutorApplication");
// import { getTutorApplications } from "../controllers/tutorApplicationController.js";

// To do
// get my application
// update the user's role if acceptedd --DONE
// delete user's application if rejected
// create check application route

const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(png|jpg|jpeg)$/)) {
      return cb(new Error("Please upload an image"));
    }

    cb(undefined, true);
  },
});

// Get all tutor applications (admin)
// router.get("/api/tutor-application", authAdmin, async (req, res) => {
//   try {
//     const tutorApplications = await TutorApplication.find().populate(
//       "userId",
//       "firstName"
//     );
//     res.json(tutorApplications);
//   } catch (err) {
//     console.error(err.message);
//     res.status(500).send("Server Error");
//   }
// });

// Get all tutor using controller
// router.get("/api/tutor-application", authAdmin, getTutorApplications);

// Get a single tutor application by ID (admin)
router.get("/api/tutor-application/:id", authAdmin, async (req, res) => {
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
});

// Accept tutor application (admin)
router.patch(
  "/api/tutor-applications/:id/approve",
  authAdmin,
  async (req, res) => {
    try {
      const tutorApplication = await TutorApplication.findById(req.params.id);

      tutorApplication.status = "accepted";

      //   const tutorApplication = await TutorApplication.findByIdAndUpdate(
      //     req.params.id,
      //     { status: "approved" },
      //     { new: true }
      //   );

      const updateRole = await User.findByIdAndUpdate(
        tutorApplication.userId,
        { role: "tutor" },
        { new: true }
      );

      await tutorApplication.save();
      await updateRole.save();

      res.json({ Application: tutorApplication, RoleUpdate: updateRole });
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server Error");
    }
  }
);

// Reject tutor application (admin)
router.patch(
  "/api/tutor-applications/:id/reject",
  authAdmin,
  async (req, res) => {
    try {
      const tutorApplication = await TutorApplication.findByIdAndUpdate(
        req.params.id,
        { status: "rejected" },
        { new: true }
      );

      tutorApplication.remove();
      res.json(tutorApplication);
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server Error");
    }
  }
);

// Create a new tutor application
router.post(
  "/api/tutor-application/create",
  auth,
  upload.single("grades"),
  async (req, res) => {
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
  }
);

// Update an existing tutor application by ID
router.put(
  "/api/tutor-application/update",
  auth,
  upload.single("grades"),
  async (req, res) => {
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
  }
);

// Delete an existing tutor application by ID
router.delete("/api/tutor-application/delete", auth, async (req, res) => {
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
});

// Route to get the uploaded image for a tutor application
router.get("/api/tutor-application/:id/image", auth, async (req, res) => {
  try {
    const tutorApplication = await TutorApplication.findById(req.params.id);

    if (!tutorApplication) {
      return res.status(404).send("Tutor application not found.");
    }

    res.set("Content-Type", tutorApplication.grades.contentType);
    res.send(tutorApplication.grades.data);
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
