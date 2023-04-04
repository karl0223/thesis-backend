import ChatRoom from "../models/chatRoom.js";

const getPublicRooms = async (req, res) => {
  try {
    const studyRooms = await ChatRoom.find({ status: "public" });
    res.json(studyRooms);
  } catch (err) {
    console.log(err);
    res.status(500).send("Server Error");
  }
};

const getPrivateRooms = async (req, res) => {
  try {
    const studyroom = await ChatRoom.find({ status: "private" });
    res.json(studyroom);
  } catch (err) {
    console.log(err);
    res.status(500).send("Server Error");
  }
};

export { getPublicRooms, getPrivateRooms };
