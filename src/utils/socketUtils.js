import User from "../models/user.js";

async function updateUserSocket(userId, socketId) {
  try {
    await User.updateOne({ _id: userId }, { socketId }, { upsert: true });
  } catch (error) {
    console.error(error);
  }
}

async function deleteUserSocket(userId) {
  try {
    await User.deleteOne({ userId });
  } catch (error) {
    console.error(error);
  }
}

async function getUserSocket(userId) {
  try {
    const user = await User.findOne({ userId });
    return user ? user.socketId : null;
  } catch (error) {
    console.error(error);
    return null;
  }
}

export { updateUserSocket, deleteUserSocket, getUserSocket };
