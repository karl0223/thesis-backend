import express from "express";
import multer from "multer";
import sharp from "sharp";
import User from "../models/user.js";
import { auth } from "../middleware/auth.js";
import {
  signup,
  login,
  logout,
  logoutAll,
  getUser,
  updateUser,
  deleteUser,
} from "../controllers/userControllers.js";

const userRouter = express.Router();

// sign up
userRouter.post("/api/users/signup", signup);

// user login
userRouter.post("/api/users/login", login);

// logout user
userRouter.post("/api/users/logout", auth, logout);

// logout user from all devices
userRouter.post("/api/users/logoutAll", auth, logoutAll);

// Get user data
userRouter.get("/api/users/me", auth, getUser);

// update user profile
userRouter.patch("/api/users/me", auth, updateUser);

// Delete user
userRouter.delete("/api/users/delete", auth, deleteUser);

const upload = multer({
  limits: {
    fileSize: 1000000,
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(png|jpg|jpeg)$/)) {
      return cb(new Error("Please upload an image"));
    }

    cb(undefined, true);
  },
});

// upload user avatar
userRouter.post(
  "/api/users/me/avatar",
  auth,
  upload.single("avatar"),
  async (req, res) => {
    const buffer = await sharp(req.file.buffer)
      .resize({ width: 250, height: 250 })
      .png()
      .toBuffer();
    req.user.avatar = buffer;
    await req.user.save();
    res.send();
  },
  (error, req, res, next) => {
    res.status(400).send({ error: error.message });
  }
);

// Delete user avatar
userRouter.delete("/api/users/me/avatar", auth, async (req, res) => {
  req.user.avatar = undefined;
  await req.user.save();
  res.send();
});

// Get user avatar
userRouter.get("/api/users/:id/avatar", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user || !user.avatar) {
      throw new Error();
    }

    res.set("Content-Type", "image/png");
    res.send(user.avatar);
  } catch (e) {
    res.status(404).send();
  }
});

export default userRouter;
