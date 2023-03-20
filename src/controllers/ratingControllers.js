import User from "../models/user.js";

const rateUser = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id);
    const oppositeRole = currentUser.role === "tutee" ? "tutor" : "tutee";
    const userToRate = await User.findOne({
      _id: req.params.id,
      role: oppositeRole,
    });

    if (!userToRate) {
      return res.status(404).json({ message: "User not found" });
    }

    const { value, feedback } = req.body;
    if (!value || !feedback) {
      return res
        .status(400)
        .json({ message: "Value and feedback are required" });
    }

    const rating = {
      value,
      feedback,
      role: oppositeRole,
    };

    userToRate.ratings.push(rating);
    await userToRate.save();

    return res.status(200).json({ message: "User rated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export { rateUser };
