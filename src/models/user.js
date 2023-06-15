import mongoose from "mongoose";
import validator from "validator";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import HelpRequest from "./askHelp.js";
import ChatRoom from "./chatRoom.js";
import Message from "./messages.js";
import TutorApplication from "./tutorApplication.js";
import Report from "./report.js";

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      index: true,
    },
    lastName: {
      type: String,
      required: true,
      index: true,
    },
    email: {
      type: String,
      unique: true,
      required: true,
      trim: true,
      lowercase: true,
      validate(value) {
        if (!validator.isEmail(value)) {
          throw new Error("Email is invalid");
        }
      },
    },
    password: {
      type: String,
      trim: true,
      minlength: 7,
      validate: {
        validator: function (value) {
          // Check if the value contains 'password'
          if (value.toLowerCase().includes("password")) {
            throw new Error("Password cannot contain 'password'");
          }

          // If the user is not using Google login, enforce the required constraint
          if (!this.googleId && !value) {
            throw new Error("Password is required");
          }

          return true;
        },
      },
    },
    tokens: [
      {
        token: {
          type: String,
          required: true,
        },
      },
    ],
    avatar: {
      type: String,
      default: "",
    },
    role: {
      type: String,
      enum: ["tutee", "tutor", "admin"],
      default: "tutee",
    },
    averageRatingAsTutor: {
      type: Number,
      default: 0,
    },
    ratingsAsTutor: [
      {
        subject: {
          subjectCode: {
            type: String,
            required: false,
          },
          description: {
            type: String,
            required: false,
          },
          subtopics: [
            {
              name: {
                type: String,
                required: false,
              },
              description: {
                type: String,
                required: false,
              },
              subtopicsRatings: [
                {
                  value: {
                    type: Number,
                    required: true,
                    min: 1,
                    max: 5,
                  },
                  feedback: {
                    type: String,
                  },
                  tuteeId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "User",
                    required: true,
                  },
                },
              ],
              averageSubtopicsRating: {
                type: Number,
                default: 0,
              },
            },
          ],
          averageSubjectsRating: {
            type: Number,
            default: 0,
          },
        },
      },
    ],
    ratingsAsTutee: [
      {
        value: {
          type: Number,
          required: true,
          min: 1,
          max: 5,
        },
        feedback: {
          type: String,
          required: true,
        },
        tutorId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
      },
    ],
    socketId: {
      type: String,
    },
    timeAndDateAvailability: {
      type: String,
      default: "",
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    hasRoom: {
      type: Boolean,
      default: false,
    },
    subjects: {
      type: [
        {
          subjectCode: {
            type: String,
            required: true,
          },
          description: {
            type: String,
            required: true,
          },
          subtopics: [
            {
              name: {
                type: String,
                required: false,
              },
              description: {
                type: String,
                required: false,
              },
            },
          ],
        },
      ],
      validate: [
        function (value) {
          return this.role === "tutor" ? Array.isArray(value) : true;
        },
        "Subjects are only allowed for tutors",
      ],
      index: true,
    },
    devices: [
      {
        deviceToken: {
          type: String,
          required: true,
        },
        fcmToken: {
          type: String,
          required: true,
        },
      },
    ],
    googleId: {
      type: String,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    verificationToken: {
      type: String,
    },
    isBanned: {
      type: Boolean,
      default: false,
    },
    resetPasswordToken: {
      type: String,
    },
    resetPasswordExpires: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.methods.toJSON = function () {
  const user = this;
  const userObject = user.toObject();

  delete userObject.password;
  delete userObject.tokens;
  delete userObject.devices;
  delete userObject.verificationToken;
  delete userObject.resetPasswordToken;
  delete userObject.resetPasswordExpires;

  return userObject;
};

userSchema.methods.generateAuthToken = async function () {
  const user = this;
  const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET);

  user.tokens = user.tokens.concat({ token });
  await user.save();

  return token;
};

userSchema.methods.generateGoogleAuthToken = async function (expirationTime) {
  const user = this;
  const token = jwt.sign(
    { _id: user._id.toString(), googleId: user.googleId },
    process.env.JWT_SECRET,
    { expiresIn: expirationTime }
  );

  user.tokens = user.tokens.concat({ token });
  await user.save();

  return token;
};

userSchema.methods.generateResetPasswordToken = async function () {
  const user = this;
  const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });

  user.resetPasswordToken = token;
  user.resetPasswordExpires = Date.now() + 3600000; // Set the expiration time to 1 hour from now
  await user.save();

  return token;
};

userSchema.statics.findByResetPasswordToken = async (token) => {
  const user = await User.findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!user) {
    throw new Error("Invalid or expired reset password token.");
  }

  return user;
};

userSchema.statics.findByCredentials = async (email, password) => {
  const user = await User.findOne({ email });

  if (!user) {
    throw new Error("Unable to login");
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    throw new Error("Unable to login");
  }

  return user;
};

// Hash the plain text password before saving
userSchema.pre("save", async function (next) {
  const user = this;

  if (user.isModified("password") && !user.googleId) {
    user.password = await bcrypt.hash(user.password, 8);
  }
  next();
});

// Pre-hook to delete associated data when the user is removed
userSchema.pre("remove", async function (next) {
  try {
    // Find chat rooms where the user is the owner or a participant with pending or accepted status
    const chatRooms = await ChatRoom.find({
      $or: [
        { owner: this._id },
        {
          participants: {
            $elemMatch: {
              userId: this._id,
              status: { $in: ["pending", "accepted"] },
            },
          },
        },
      ],
    });

    // Iterate through each chat room and perform the appropriate action
    for (const chatRoom of chatRooms) {
      // Check if the user is the owner
      if (chatRoom.owner.equals(this._id)) {
        // Delete the entire chat room
        await chatRoom.remove();
      } else {
        // Remove the user from the chat room as a participant
        chatRoom.participants = chatRoom.participants.filter(
          (participant) => !participant.userId.equals(this._id)
        );
        await chatRoom.save();
      }
    }

    // Delete user's tutor applications
    await TutorApplication.deleteMany({ userId: this._id });

    // Delete reports involving the user
    await Report.deleteMany({
      $or: [{ reporter: this._id }, { reportedUser: this._id }],
    });

    // Delete Messages
    await Message.deleteMany({ userId: this._id });

    // Delete user's help requests
    await HelpRequest.deleteMany({
      $or: [{ tutorId: this._id }, { studentId: this._id }],
    });

    // Remove the user reference from ratingsAsTutor
    await User.updateMany(
      {},
      {
        $pull: {
          "ratingsAsTutor.$[].subtopics.$[].subtopicsRatings": {
            tuteeId: this._id,
          },
        },
      },
      { multi: true }
    );

    // Remove the user reference from ratingsAsTutee
    await User.updateMany(
      {},
      { $pull: { ratingsAsTutee: { tutorId: this._id } } },
      { multi: true }
    );

    next();
  } catch (error) {
    next(error);
  }
});

const User = mongoose.model("User", userSchema);

export default User;
