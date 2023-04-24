import mongoose from "mongoose";
import validator from "validator";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
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
    age: {
      type: Number,
      default: 0,
      validate(value) {
        if (value < 0) {
          throw new Error("Age must be a positive number");
        }
      },
    },
    password: {
      type: String,
      required: true,
      trim: true,
      minlength: 7,
      validate(value) {
        if (value.toLowerCase().includes("password")) {
          throw new Error("Password cannot contain 'password'");
        }
      },
    },
    posts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post",
      },
    ],
    tokens: [
      {
        token: {
          type: String,
          required: true,
        },
      },
    ],
    avatar: {
      type: Buffer,
    },
    role: {
      type: String,
      enum: ["tutee", "tutor", "admin"],
      default: "tutee",
    },
    tutorRatings: [
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
    tuteeRatings: [
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
    },
    subjects: {
      type: [
        {
          name: {
            type: String,
            required: true,
          },
          description: {
            type: String,
            required: true,
          },
        },
      ],
      validate: [
        function (value) {
          return this.role === "tutor" ? Array.isArray(value) : true;
        },
        "Subjects are only allowed for tutors",
      ],
    },
    devices: [
      {
        deviceToken: {
          type: String,
          required: true,
          unique: true,
        },
        fcmToken: {
          type: String,
          required: true,
        },
      },
    ],
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
  delete userObject.avatar;

  return userObject;
};

userSchema.virtual("currentRoleRating").get(function () {
  const role = this.role;
  const ratings = this.ratings.filter((rating) => rating.role === role);
  if (ratings.length === 0) {
    return 0;
  }
  const sum = ratings.reduce((acc, curr) => acc + curr.value, 0);
  return sum / ratings.length;
});

userSchema.virtual("tutorRating").get(function () {
  const tutorRatings = this.ratings.filter((rating) => rating.role === "tutor");
  if (tutorRatings.length === 0) {
    return 0;
  }
  const sum = tutorRatings.reduce((acc, curr) => acc + curr.value, 0);
  const average = sum / tutorRatings.length;
  return average;
});

userSchema.virtual("tuteeRating").get(function () {
  const tuteeRatings = this.ratings.filter((rating) => rating.role === "tutee");
  if (tuteeRatings.length === 0) {
    return 0;
  }
  const sum = tuteeRatings.reduce((acc, curr) => acc + curr.value, 0);
  const average = sum / tuteeRatings.length;
  return average;
});

// userSchema.methods.addRating = function (role, value, feedback) {
//   this.ratings.push({ role, value, feedback });
// };

userSchema.methods.generateAuthToken = async function () {
  const user = this;
  const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET);

  user.tokens = user.tokens.concat({ token });
  await user.save();

  return token;
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

  if (user.isModified("password")) {
    user.password = await bcrypt.hash(user.password, 8);
  }
  next();
});

// Delete user tasks when user is removed
// userSchema.pre("remove", async function (next) {
//   const user = this;
//   await Task.deleteMany({ owner: user._id });
//   next();
// });

const User = mongoose.model("User", userSchema);

export default User;
