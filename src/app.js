import express from "express";
import dotenv from "dotenv";
dotenv.config();
import "./db/mongoose.js";
import userRouter from "./routers/user.js";
import tutorApplicationRouter from "./routers/tutorApplication.js";
import ratingsRouter from "./routers/ratings.js";
import reportRouter from "./routers/report.js";
import analyticsRouter from "./routers/analytics.js";
import homeRouter from "./routers/home.js";
import { socketAuth } from "./middleware/auth.js";
import studyRoomRouter from "./routers/studyRoom.js";
import tutorRouter from "./routers/tutorRouter.js";
import rateRouter from "./routers/rateRouter.js";

const app = express();

import http from "http";
import { Server } from "socket.io";

const server = http.createServer(app);
const io = new Server(server);

import socketController from "./controllers/socketControllers.js";
io.use(socketAuth);
socketController(io);

app.set("socketio", io);
app.use(express.json());
app.use(userRouter);
app.use(tutorApplicationRouter);
app.use(ratingsRouter);
app.use(reportRouter);
app.use(analyticsRouter);
app.use(homeRouter);
app.use(studyRoomRouter);
app.use(tutorRouter);
app.use(rateRouter);

export default server;
