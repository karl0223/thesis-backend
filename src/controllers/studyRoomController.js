import ChatRoom from "../models/chatRoom.js";

const getPublicRooms = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const startIndex = (page - 1) * limit;

    const totalRooms = await ChatRoom.countDocuments({ status: "public" });
    const totalPages = Math.ceil(totalRooms / limit);

    const studyRooms = await ChatRoom.find({ status: "public" })
      .skip(startIndex)
      .limit(limit);

    res.json({
      rooms: studyRooms,
      totalPages,
      currentPage: page,
      totalRooms,
    });
  } catch (err) {
    console.log(err);
    res.status(500).send("Server Error");
  }
};

const getPrivateRooms = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const startIndex = (page - 1) * limit;

    const totalRooms = await ChatRoom.countDocuments({ status: "private" });
    const totalPages = Math.ceil(totalRooms / limit);

    const studyRooms = await ChatRoom.find({ status: "private" })
      .skip(startIndex)
      .limit(limit);

    res.json({
      rooms: studyRooms,
      totalPages,
      currentPage: page,
      totalRooms,
    });
  } catch (err) {
    console.log(err);
    res.status(500).send("Server Error");
  }
};

export { getPublicRooms, getPrivateRooms };
