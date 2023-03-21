import mongoose from "mongoose";

const reportSchema = new mongoose.Schema({
  reporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  reportedUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  category: {
    type: String,
    enum: ["spam", "harassment", "inappropriate content", "other"],
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "resolved", "dismissed"],
    default: "pending",
  },
});

const Report = mongoose.model("Report", reportSchema);

export default Report;
