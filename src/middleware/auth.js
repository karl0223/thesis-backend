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

    req.token = token;
    req.user = user;
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

// const socketAuth = async (socket, next) => {
//   try {
//     const token = socket.request.headers.authorization.replace("Bearer ", "");
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     const user = await User.findOne({
//       _id: decoded._id,
//       "tokens.token": token,
//     });

//     if (!user) {
//       throw new Error();
//     }

//     socket.request.user = user;
//     socket.request.token = token;
//     next();
//   } catch (e) {
//     next(new Error("Please authenticate."));
//   }
// };

const socketAuth = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
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
