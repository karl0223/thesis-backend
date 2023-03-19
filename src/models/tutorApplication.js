const mongoose = require("mongoose");

const tutorApplicationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  grades: {
    data: Buffer,
    contentType: String,
  },
  briefIntro: {
    type: String,
    required: true,
  },
  teachingExperience: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
});

const TutorApplication = mongoose.model(
  "TutorApplication",
  tutorApplicationSchema
);

module.exports = TutorApplication;
