import User from "../models/user.js";

const updateUserSocket = async (userId, socketId) => {
  try {
    await User.updateOne({ _id: userId }, { socketId }, { upsert: true });
  } catch (error) {
    console.error(error);
  }
};

const deleteUserSocket = async (userId) => {
  try {
    await User.updateOne({ _id: userId }, { $set: { socketId: "" } });
  } catch (error) {
    console.error(error);
  }
};

const getUserSocket = async (userId) => {
  try {
    const user = await User.findOne({ _id: userId });
    return user ? user.socketId : null;
  } catch (error) {
    console.error(error);
    return null;
  }
};

export { updateUserSocket, deleteUserSocket, getUserSocket };
