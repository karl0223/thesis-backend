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
    return user
      ? user.socketIds && user.socketIds.length > 0
        ? user.socketIds[0]
        : null
      : null;
  } catch (error) {
    console.error(error);
    return null;
  }
};

export { updateUserSocket, deleteUserSocket, getUserSocket };
