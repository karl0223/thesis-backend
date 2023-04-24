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
    const fcmToken = req.header("fcmToken");

    const deviceIndex = user.devices.findIndex(
      (device) => device.deviceToken === deviceToken
    );
    if (deviceIndex === -1) {
      // add a new device object to the devices array
      user.devices.push({ deviceToken, fcmToken });
      await user.save();
    } else {
      // update the FCM token for the existing device object
      user.devices[deviceIndex].fcmToken = fcmToken;
      await user.save();
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    res.status(401).send({ error: "Please authenticate." });
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
