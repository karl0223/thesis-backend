import jwt from "jsonwebtoken";
import User from "../models/user.js";

const auth = async (req, res, next) => {
  try {
    const token = req.header("Authorization").replace("Bearer ", "");
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({
      _id: decoded._id,
      "tokens.token": token,
    });

    if (!user) {
      throw new Error();
    }

    // check if the device token is present in the user's devices array
    const deviceToken = req.header("deviceToken");
    if (
      !deviceToken ||
      !user.devices.find((device) => device.deviceToken === deviceToken)
    ) {
      throw new Error();
    }

    req.token = token;
    req.user = user;
    req.deviceToken = deviceToken;

    next();
  } catch (e) {
    res.status(401).send({ error: "Please Authenticate." });
  }
};

const isAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).send({ error: "Access denied." });
  }

  next();
};

const socketAuth = async (socket, next) => {
  try {
    const token = socket.handshake.query.authToken;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({
      _id: decoded._id,
      "tokens.token": token,
    });

    if (!user) {
      throw new Error();
    }

    socket.request.user = user;
    socket.request.token = token;

    console.log(`Socket ${socket.id} authenticated`);
    next();
  } catch (e) {
    next(new Error("Please authenticate."));
  }
};

const authAdmin = (req, res, next) => {
  auth(req, res, () => {
    isAdmin(req, res, next);
  });
};

export { auth, isAdmin, authAdmin, socketAuth };
