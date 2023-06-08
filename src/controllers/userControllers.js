import User from "../models/user.js";
import {
  sendVerificationEmail,
  sendResetPasswordEmail,
} from "../utils/verifyEmail.js";

import { OAuth2Client } from "google-auth-library";
import { google } from "googleapis";

const client = new OAuth2Client(process.env.CLIENT_ID);

const signup = async (req, res) => {
  const { email } = req.body;
  const emailRegex = /^[A-Za-z0-9._%+-]+@cvsu\.edu\.ph$/;

  if (emailRegex.test(email)) {
    const user = new User(req.body);
    const deviceToken = req.body.deviceToken;
    const fcmToken = req.body.fcmToken;
    try {
      user.devices = [{ deviceToken, fcmToken }];
      await user.save();
      await sendVerificationEmail(user);

      res.status(201).send({ user });
    } catch (e) {
      res.status(400).send(e);
    }
  } else {
    res.status(400).send("Invalid email address");
  }
};

const login = async (req, res) => {
  try {
    const { email, password, deviceToken, fcmToken } = req.body;

    const user = await User.findByCredentials(email, password);
    const updatedDevice = { deviceToken, fcmToken };
    const deviceIndex = user.devices.findIndex(
      (device) => device.deviceToken === deviceToken
    );

    if (!user.isEmailVerified) {
      return res.send({ message: "Please verify your email address" });
    }

    if (user.isBanned) {
      return res
        .status(403)
        .send({ message: "You are banned from the system" });
    }

    if (deviceIndex === -1) {
      // the device is new, so add it to the user's devices array
      user.devices.push(updatedDevice);
    } else {
      // update the existing device's fcmToken
      user.devices[deviceIndex].fcmToken = fcmToken;
    }

    await user.save();

    const token = await user.generateAuthToken();

    const userInfo = await User.findById(user._id)
      .populate({
        path: "ratingsAsTutor",
        select: "subject value feedback tuteeId",
        populate: {
          path: "subject.subtopics.subtopicsRatings.tuteeId",
          select: "firstName lastName avatar",
        },
      })
      .populate({
        path: "ratingsAsTutee",
        select: "value feedback tutorId",
        populate: {
          path: "tutorId",
          select: "firstName lastName avatar",
        },
      })
      .exec();

    res.send({ user: userInfo, token });
  } catch (e) {
    res.status(400).send();
  }
};

const signInWithGoogle = async (req, res) => {
  const { id_token, access_token, deviceToken, fcmToken } = req.body;

  try {
    // Set the access token on the OAuth2 client
    client.setCredentials({ access_token });

    // Retrieve user profile details using the Google People API
    const people = google.people({ version: "v1", auth: client });

    // Fetch user's profile information
    const profile = await people.people.get({
      resourceName: "people/me",
      personFields: "names",
    });

    const firstName = profile.data.names[0]?.givenName || "";
    const lastName = profile.data.names[0]?.familyName || "";

    const ticket = await client.verifyIdToken({
      idToken: id_token,
      audience: process.env.CLIENT_ID,
    });

    const { email, sub } = ticket.getPayload();

    const emailRegex = /^[A-Za-z0-9._%+-]+@cvsu\.edu\.ph$/;

    if (emailRegex.test(email)) {
      const existingUser = await User.findOne({ email });

      if (existingUser && !existingUser.googleId) {
        return res.status(409).json({
          error: "Email already registered through traditional login",
        });
      }

      // Check if user with the same Google ID exists
      let user = await User.findOne({
        googleId: sub,
      });

      if (!user) {
        // Create a new user if not found
        user = new User({
          firstName: firstName,
          lastName: lastName,
          email,
          googleId: sub,
        });

        await user.save();
      }

      if (user.isBanned) {
        return res
          .status(403)
          .send({ message: "You are banned from the system" });
      }

      const updatedDevice = { deviceToken, fcmToken };

      const deviceIndex = user.devices.findIndex(
        (device) => device.deviceToken === deviceToken
      );

      if (deviceIndex === -1) {
        // the device is new, so add it to the user's devices array
        user.devices.push(updatedDevice);
      } else {
        // update the existing device's fcmToken
        user.devices[deviceIndex].fcmToken = fcmToken;
      }

      await user.save();

      // Generate JWT token for authentication
      const token = await user.generateGoogleAuthToken();

      const userInfo = await User.findById(user._id)
        .populate({
          path: "ratingsAsTutor",
          select: "subject value feedback tuteeId",
          populate: {
            path: "subject.subtopics.subtopicsRatings.tuteeId",
            select: "firstName lastName avatar",
          },
        })
        .populate({
          path: "ratingsAsTutee",
          select: "value feedback tutorId",
          populate: {
            path: "tutorId",
            select: "firstName lastName avatar",
          },
        })
        .exec();

      return res.status(200).json({ user: userInfo, token });
    } else {
      return res.status(400).send("Invalid email address");
    }
  } catch (error) {
    console.error("Error verifying Google token:", error);
    res.status(401).json({ error: "Failed to verify Google token" });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Find the user by their email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.googleId) {
      return res
        .status(400)
        .json({ message: "Cannot reset password for Google users" });
    }

    // Generate the reset password token
    const resetToken = await user.generateResetPasswordToken();

    await sendResetPasswordEmail(resetToken, user.email);

    res.json({ message: "Reset password token sent to your email" });
  } catch (error) {
    res.status(500).json({ error: "Failed to generate reset password token" });
  }
};

const renderResetPasswordPage = async (req, res) => {
  try {
    const { token } = req.query;

    res.render("reset_password", { resetToken: token });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token } = req.query;
    const { password } = req.body;

    // Find the user by the reset password token
    const user = await User.findByResetPasswordToken(token);

    // Update the user's password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.render("reset_success");
  } catch (error) {
    res.render("error");
  }
};

const logout = async (req, res) => {
  try {
    const deviceToken = req.deviceToken;

    req.user.tokens = req.user.tokens.filter((token) => {
      return token.token !== req.token;
    });

    // remove the device with the given token from the user's devices array
    req.user.devices = req.user.devices.filter(
      (device) => device.deviceToken !== deviceToken
    );

    await req.user.save();

    res.send();
  } catch (e) {
    res.status(500).send();
  }
};

const logoutAll = async (req, res) => {
  try {
    req.user.tokens = [];
    req.user.devices = [];

    await req.user.save();

    res.send();
  } catch (e) {
    res.status(500).send();
  }
};

const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate({
        path: "ratingsAsTutor",
        select: "subject value feedback tuteeId",
        populate: {
          path: "subject.subtopics.subtopicsRatings.tuteeId",
          select: "firstName lastName avatar",
        },
      })
      .populate({
        path: "ratingsAsTutee",
        select: "value feedback tutorId",
        populate: {
          path: "tutorId",
          select: "firstName lastName avatar",
        },
      })
      .exec();

    if (!user) {
      return res.status(404).send("User not found.");
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(400).send(error);
  }
};

const updateUser = async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = [
    "firstName",
    "lastName",
    "email",
    "password",
    "timeAndDateAvailability",
    "isAvailable",
  ];
  const isValidOperation = updates.every((update) =>
    allowedUpdates.includes(update)
  );

  if (!isValidOperation) {
    return res.status(400).send({ error: "Invalid updates!" });
  }

  try {
    updates.forEach((update) => {
      req.user[update] = req.body[update];
    });

    await req.user.save();

    res.send(req.user);
  } catch (e) {
    res.status(400).send();
  }
};

const uploadProfilePicture = async (req, res) => {
  const { image } = req.body;
  try {
    const user = await User.findById(req.user._id);
    user.avatar = image;
    await user.save();

    res.send(user);
  } catch (error) {
    console.error(error);
    res.status(500).send();
  }
};

const deleteUser = async (req, res) => {
  try {
    await req.user.remove();
    res.send(req.user);
  } catch (e) {
    res.status(500).send();
  }
};

export {
  signup,
  login,
  signInWithGoogle,
  forgotPassword,
  renderResetPasswordPage,
  resetPassword,
  logout,
  logoutAll,
  getUser,
  updateUser,
  uploadProfilePicture,
  deleteUser,
};
