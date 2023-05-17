import User from "../models/user.js";

const rateParticipants = async (req, res) => {
  try {
    const { participants } = req.body;
    const tutorId = req.user._id;

    const promises = participants.map(async (participant) => {
      const tuteeId = participant._id;
      const rating = participant.rating;
      const feedback = participant.feedback;

      await User.findOneAndUpdate(
        { _id: tuteeId, "ratingsAsTutee.tutorId": tutorId },
        {
          $set: {
            "ratingsAsTutee.$.value": rating,
            "ratingsAsTutee.$.feedback": feedback,
          },
        },
        { upsert: true }
      );
    });

    await Promise.all(promises);

    res.status(200).send("Ratings submitted successfully");
  } catch (error) {
    res.status(400).send(error.message);
  }
};

const rateTutor = async (req, res) => {
  try {
    const { rating, feedback, tutorId } = req.body;
    const tuteeId = req.user._id;

    const tutor = await User.findById(tutorId);
    if (!tutor) {
      throw new Error(`User with ID ${tutorId} not found`);
    }

    await User.findOneAndUpdate(
      { _id: tutorId, "ratingsAsTutor.tuteeId": tuteeId },
      {
        $set: {
          "ratingsAsTutor.$.value": rating,
          "ratingsAsTutor.$.feedback": feedback,
        },
      },
      { upsert: true }
    );

    res.status(200).send("Rating submitted successfully");
  } catch (error) {
    res.status(400).send(error);
  }
};

const clearRatings = async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }

    user.ratingsAsTutor = [];
    user.ratingsAsTutee = [];

    await user.save();
    res.send("Ratings cleared successfully");
  } catch (err) {
    console.log(err);
    res.status(500).send("Server Error");
  }
};

export { rateParticipants, rateTutor, clearRatings };
