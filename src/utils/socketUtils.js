import User from "../models/user.js";

const updateUserSocket = async (userId, socketId) => {
  try {
    await User.updateOne({ _id: userId }, { $push: { socketIds: socketId } });
  } catch (error) {
    console.error(error);
  }
};

const deleteUserSocket = async (userId, socketId) => {
  try {
    await User.updateOne({ _id: userId }, { $pull: { socketIds: socketId } });
  } catch (error) {
    console.error(error);
  }
};

const getUserSocket = async (userId) => {
  try {
    const user = await User.findOne({ _id: userId });
    return user ? user.socketIds[0] : [];
  } catch (error) {
    console.error(error);
    return [];
  }
};

export { updateUserSocket, deleteUserSocket, getUserSocket };
