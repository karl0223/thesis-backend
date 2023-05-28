import User from "../models/user.js";

const rateParticipants = async (req, res) => {
  try {
    const { participants } = req.body;
    const tutorId = req.user._id;

    const promises = participants.map(async (participant) => {
      const tuteeId = participant._id;
      const rating = participant.rating;
      const feedback = participant.feedback;

      const user = await User.findById(tuteeId);

      if (!user) {
        throw new Error(`User with ID ${tuteeId} not found`);
      }

      const ratingIndex = user.ratingsAsTutee.findIndex(
        (rating) => rating.tutorId.toString() === tutorId.toString()
      );

      if (ratingIndex !== -1) {
        // If there is an existing rating, update it
        user.ratingsAsTutee[ratingIndex].value = rating;
        user.ratingsAsTutee[ratingIndex].feedback = feedback;
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
    const { subject, rating, feedback, tutorId } = req.body;
    const tuteeId = req.user._id;

    const tutor = await User.findById(tutorId);
    if (!tutor) {
      throw new Error(`User with ID ${tutorId} not found`);
    }

    // Find the subject index for the given subjectCode
    const subjectIndex = tutor.ratingsAsTutor.findIndex(
      (entry) => entry.subject.subjectCode === subject.subjectCode
    );

    if (subjectIndex !== -1) {
      // If the subject exists, find the subtopic index for the given subtopicName
      const subtopicIndex = tutor.ratingsAsTutor[
        subjectIndex
      ].subject.subtopics.findIndex(
        (subtopic) => subtopic.name === subject.subtopics[0].name
      );

      if (subtopicIndex !== -1) {
        // If the subtopic exists, find the rating index for the tutee
        const ratingIndex = tutor.ratingsAsTutor[
          subjectIndex
        ].subject.subtopics[subtopicIndex].subtopicsRatings.findIndex(
          (rating) => rating.tuteeId.toString() === tuteeId.toString()
        );

        if (ratingIndex !== -1) {
          // If there is an existing rating, update it
          tutor.ratingsAsTutor[subjectIndex].subject.subtopics[
            subtopicIndex
          ].subtopicsRatings[ratingIndex].value = rating;
          tutor.ratingsAsTutor[subjectIndex].subject.subtopics[
            subtopicIndex
          ].subtopicsRatings[ratingIndex].feedback = feedback;
        } else {
          // If there is no existing rating, create a new one
          tutor.ratingsAsTutor[subjectIndex].subject.subtopics[
            subtopicIndex
          ].subtopicsRatings.push({
            value: rating,
            feedback,
            tuteeId,
          });
        }

        // Calculate average rating for the subtopic
        const subtopicRatings = tutor.ratingsAsTutor[
          subjectIndex
        ].subject.subtopics[subtopicIndex].subtopicsRatings.map(
          (rating) => rating.value
        );
        const subtopicAverageRating =
          subtopicRatings.reduce((sum, value) => sum + value, 0) /
          subtopicRatings.length;

        // Update the average rating for the subtopic
        tutor.ratingsAsTutor[subjectIndex].subject.subtopics[
          subtopicIndex
        ].averageSubtopicsRating = subtopicAverageRating.toFixed(2);

        // Calculate average rating for the subject
        const subjectSubtopicAverages = tutor.ratingsAsTutor[
          subjectIndex
        ].subject.subtopics.map((subtopic) => subtopic.averageSubtopicsRating);
        const subjectAverageRating =
          subjectSubtopicAverages.reduce((sum, value) => sum + value, 0) /
          subjectSubtopicAverages.length;

        // Update the average rating for the subject
        tutor.ratingsAsTutor[subjectIndex].subject.averageSubjectsRating =
          subjectAverageRating.toFixed(2);
      } else {
        // If the subtopic does not exist, create a new entry
        const newSubtopic = {
          name: subject.subtopics[0].name,
          description: subject.subtopics[0].description,
          subtopicsRatings: [
            {
              value: rating,
              feedback,
              tuteeId,
            },
          ],
          averageSubtopicsRating: rating, // Set initial average rating as the first rating value
        };

        tutor.ratingsAsTutor[subjectIndex].subject.subtopics.push(newSubtopic);

        // Calculate average rating for the subject
        const subjectSubtopicAverages = tutor.ratingsAsTutor[
          subjectIndex
        ].subject.subtopics.map((subtopic) => subtopic.averageSubtopicsRating);
        const subjectAverageRating =
          subjectSubtopicAverages.reduce((sum, value) => sum + value, 0) /
          subjectSubtopicAverages.length;

        // Update the average rating for the subject
        tutor.ratingsAsTutor[subjectIndex].subject.averageSubjectsRating =
          subjectAverageRating.toFixed(2);
      }
    } else {
      // If the subject does not exist, create a new entry
      const newSubject = {
        subject: {
          subjectCode: subject.subjectCode,
          description: subject.description,
          subtopics: [
            {
              name: subject.subtopics[0].name,
              description: subject.subtopics[0].description,
              subtopicsRatings: [
                {
                  value: rating,
                  feedback,
                  tuteeId,
                },
              ],
              averageSubtopicsRating: rating, // Set initial average rating as the first rating value
            },
          ],
          averageSubjectsRating: rating, // Set initial average rating as the first rating value
        },
      };

      tutor.ratingsAsTutor.push(newSubject);
    }

    // Calculate average rating for all subjects
    const subjectAverages = tutor.ratingsAsTutor.map(
      (entry) => entry.subject.averageSubjectsRating
    );
    const overallAverageRating =
      subjectAverages.reduce((sum, value) => sum + value, 0) /
      subjectAverages.length;

    // Update the average rating for the tutor
    tutor.averageRatingAsTutor = overallAverageRating.toFixed(2);

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
