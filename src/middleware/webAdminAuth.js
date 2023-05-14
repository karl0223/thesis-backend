import jwt from "jsonwebtoken";
import User from "../models/user.js";

const webAuth = async (req, res, next) => {
  try {
    const token =
      req.cookies.access_token ||
      req.header("Authorization").replace("Bearer ", "");
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({
      _id: decoded._id,
      "tokens.token": token,
    });

    if (!user) {
      throw new Error();
    }

    // check if the device token and FCM token headers are present in the request
    const deviceToken = req.header("deviceToken");
    const fcmToken = req.header("fcmToken");

    if (deviceToken && fcmToken) {
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
    }

    req.deviceToken = deviceToken;
    req.fcmToken = fcmToken;
    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    // Redirect to login page if not authenticated
    res.redirect("/login");
  }
};

const webAdminAuth = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.redirect("/login");
  }
  next();
};

export { webAuth, webAdminAuth };
