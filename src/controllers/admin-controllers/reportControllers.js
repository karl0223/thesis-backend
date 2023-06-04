import Report from "../../models/report.js";
import User from "../../models/user.js";
import ChatRoom from "../../models/chatRoom.js";
import HelpRequest from "../../models/askHelp.js";
import { getReportsAnalytics } from "./analyticsControllers.js";
import { getUserSocket } from "../../utils/socketUtils.js";

const getAllReports = async (req, res) => {
  try {
    const reportData = await getReportsAnalytics();
    const reports = await Report.find()
      .populate("reporter", "firstName lastName")
      .populate("reportedUser", "firstName lastName")
      .lean();

    // Format the date for each report
    reports.forEach((report) => {
      report.formattedDate = new Date(report.date).toLocaleString();
    });

    res.render("reports", { reports, reportData: JSON.stringify(reportData) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Create a new report
const reportUser = async (req, res) => {
  try {
    const { reportedUser, content, category } = req.body;
    const io = req.app.get("socketio");
    const report = new Report({
      reporter: req.user._id,
      reportedUser,
      content,
      category,
    });
    await report.save();

    const reportedUserSocket = await getUserSocket(reportedUser);
    io.to(reportedUserSocket).emit("new-report", report);

    res.status(201).json(report);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

const updateReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const io = req.app.get("socketio");

    let report;
    if (status === "dismissed" || status === "resolved") {
      report = await Report.findByIdAndUpdate(id, { status }, { new: true });
      if (!report) {
        return res.status(404).json({ message: "Report not found" });
      }
    } else if (status === "revoke") {
      const newStatus = "dismissed";
      report = await Report.findByIdAndUpdate(
        id,
        { status: newStatus },
        { new: true }
      );

      if (!report) {
        return res.status(404).json({ message: "Report not found" });
      }

      await User.findByIdAndUpdate(
        report.reportedUser._id,
        { isBanned: false },
        { new: true }
      );
    } else {
      return res.status(400).json({ message: "Invalid status" });
    }

    const reporterSocket = await getUserSocket(report.reporter._id);
    const reportedUserSocket = await getUserSocket(report.reportedUser._id);

    if (status === "resolved") {
      await User.findByIdAndUpdate(
        report.reportedUser._id,
        { isBanned: true, tokens: [] },
        { new: true }
      );

      const userId = report.reportedUser._id;

      const chatRooms = await ChatRoom.find({
        $or: [
          { owner: userId },
          {
            "participants.userId": userId,
            "participants.status": { $in: ["accepted", "pending"] },
          },
        ],
      });

      const requests = await HelpRequest.find({
        studentId: userId,
        reqStatus: "pending",
      });

      if (requests || requests.length !== 0) {
        for (const request of requests) {
          let tutorSocket = await getUserSocket(request.tutorId);
          io.to(tutorSocket).emit("request-remove", request);
          await HelpRequest.deleteOne({ _id: request._id });
        }
      }

      if (chatRooms || chatRooms.length !== 0) {
        for (const chatRoom of chatRooms) {
          if (chatRoom.owner.toString() === userId.toString()) {
            // Soft delete the chat room if the user is the owner
            chatRoom.deletedAt = new Date();
            await chatRoom.save();

            const participantsToKick = chatRoom.participants;
            // Kick each participant
            for (const participant of participantsToKick) {
              let user = await User.findById(participant.userId);
              user.hasRoom = false;
              await user.save();
              await ChatRoom.updateOne(
                { _id: chatRoom._id },
                { $pull: { participants: { userId: participant.userId._id } } }
              );
            }

            io.to(chatRoom._id.toString()).emit("room-deleted", {
              roomId: chatRoom._id,
            });
          } else {
            // Remove the participant from the chat room if the user is not the owner
            await ChatRoom.updateOne(
              { _id: chatRoom._id },
              { $pull: { participants: { userId: userId } } }
            );

            // Update the user's hasRoom field
            let user = await User.findById(userId);
            user.hasRoom = false;
            await user.save();

            io.to(chatRoom._id.toString()).emit("user-left", {
              roomId: chatRoom._id,
              user: {
                userId,
                firstName: req.user.firstName,
                lastName: req.user.lastName,
              },
              sessionEnded: chatRoom.sessionEnded,
            });
          }
        }
      }
    }

    io.to(reporterSocket).emit("report-result", report);
    io.to(reportedUserSocket).emit("report-result", report);

    return res.status(200).json(report);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

export { getAllReports, reportUser, updateReport };
