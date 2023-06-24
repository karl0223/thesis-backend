import User from "../models/user.js";

const updateUserSocket = async (userId, socketId) => {
  try {
    await User.updateOne(
      { _id: userId },
      { $push: { socketIds: socketId } },
      { upsert: true }
    );
  } catch (error) {
    console.error(error);
  }
};

const deleteUserSocket = async (userId, socketId) => {
  try {
    await User.updateOne(
      { _id: userId },
      { $pull: { socketIds: socketId } },
      { upsert: true }
    );
  } catch (error) {
    console.error(error);
  }
};

const getUserSocket = async (userId) => {
  try {
    const user = await User.findOne({ _id: userId });
    return user ? user.socketIds : [];
  } catch (error) {
    console.error(error);
    return [];
  }
};

const sendMultipleEmits = async (io, socketIds, event, data) => {
  socketIds.forEach((socketId) => {
    io.to(socketId).emit(event, data);
  });
};

export { updateUserSocket, deleteUserSocket, getUserSocket, sendMultipleEmits };
