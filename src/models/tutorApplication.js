import mongoose from "mongoose";

const tutorApplicationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  grades: {
    type: String,
  },
  briefIntro: {
    type: String,
    required: true,
  },
  teachingExperience: {
    type: String,
    required: true,
  },
  subject: [
    {
      subjectCode: {
        type: String,
        required: true,
      },
      description: {
        type: String,
        required: true,
      },
      grade: {
        type: String,
        required: true,
      },
    },
  ],
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

export default TutorApplication;
