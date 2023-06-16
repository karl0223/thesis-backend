import express from "express";
import User from "../models/user.js";
import { auth, authAdmin } from "../middleware/auth.js";
import {
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
  deleteUserById,
} from "../controllers/userControllers.js";

import { verifyEmail } from "../utils/verifyEmail.js";

const userRouter = express.Router();

// sign up
userRouter.post("/api/users/signup", signup);

// verify email
userRouter.get("/api/users/verify", verifyEmail);

userRouter.get("/api/reset-password", renderResetPasswordPage);

userRouter.post("/api/forgot-password", forgotPassword);

userRouter.post("/api/reset-password", resetPassword);

// user login
userRouter.post("/api/users/login", login);

// Google login
userRouter.post("/google-login", signInWithGoogle);

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

userRouter.delete("/api/users/delete/:id", authAdmin, deleteUserById);

// upload user avatar
userRouter.post("/api/users/me/avatar", auth, uploadProfilePicture);

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
      return res.status(404).send("No user or user avatar found");
    }

    res.send(user.avatar);
  } catch (e) {
    console.error(e);
    res.status(500).send("Server Error");
  }
});

export default userRouter;
