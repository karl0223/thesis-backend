import User from "../models/user.js";

const rateParticipants = async (req, res) => {
  try {
    const { rating, feedback, participants } = req.body;
    const tutorId = req.user._id;

    console.log(participants);

    const promises = participants.map(async (participant) => {
      const tuteeId = participant._id;

      const user = await User.findById(tuteeId);
      if (!user) {
        throw new Error(`User with ID ${tuteeId} not found`);
      }

      // Find the index of the tutor's rating for this tutee, if it exists
      const tuteeRatingIndex = user.ratingsAsTutee.findIndex(
        (rating) => rating.tutorId.toString() === tutorId.toString()
      );

      if (tuteeRatingIndex !== -1) {
        // If there is an existing rating, update it
        user.ratingsAsTutee[tuteeRatingIndex].value = rating;
        user.ratingsAsTutee[tuteeRatingIndex].feedback = feedback;
      } else {
        // If there is no existing rating, create a new one
        user.ratingsAsTutee.push({ value: rating, feedback, tutorId });
      }

      await user.save();
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

    // Find the index of the tutee's rating for this tutor, if it exists
    const tutorRatingIndex = tutor.ratingsAsTutor.findIndex(
      (rating) => rating.tuteeId.toString() === tuteeId.toString()
    );

    if (tutorRatingIndex !== -1) {
      // If there is an existing rating, update it
      tutor.ratingsAsTutor[tutorRatingIndex].value = rating;
      tutor.ratingsAsTutor[tutorRatingIndex].feedback = feedback;
    } else {
      // If there is no existing rating, create a new one
      tutor.ratingsAsTutor.push({ value: rating, feedback, tuteeId });
    }

    await tutor.save();

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
