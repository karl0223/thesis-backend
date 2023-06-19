import User from "../models/user.js";

const updateUserSocket = async (userId, socketId) => {
  try {
    await User.updateOne(
      { _id: userId },
      { $set: { [`socketIds.${userId}`]: socketId } },
      { upsert: true }
    );
  } catch (error) {
    console.error(error);
  }
};

const deleteUserSocket = async (userId) => {
  try {
    await User.updateOne(
      { _id: userId },
      { $unset: { [`socketIds.${userId}`]: 1 } }
    );
  } catch (error) {
    console.error(error);
  }
};

const getUserSocket = async (userId) => {
  try {
    const user = await User.findOne({ _id: userId });
    return user ? user.socketIds[userId] : null;
  } catch (error) {
    console.error(error);
    return null;
  }
};

export { updateUserSocket, deleteUserSocket, getUserSocket };
