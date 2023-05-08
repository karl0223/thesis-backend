import mongoose from "mongoose";

const helpRequestSchema = new mongoose.Schema({
  tutorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["public", "private"],
    default: "public",
  },
  location: {
    type: String,
    required: true,
  },
  schedule: {
    type: String,
    required: true,
  },
  subject: {
    subjectCode: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    subtopics: [
      {
        name: {
          type: String,
          required: true,
        },
        description: {
          type: String,
          required: true,
        },
      },
    ],
  },
  reqStatus: {
    type: String,
    enum: ["pending", "accepted", "rejected"],
    default: "pending",
  },
});

const HelpRequest = mongoose.model("HelpRequest", helpRequestSchema);

export default HelpRequest;
