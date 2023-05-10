import express from "express";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
dotenv.config();
import "./db/mongoose.js";
import userRouter from "./routers/user.js";
import tutorApplicationRouter from "./routers/tutorApplication.js";
// import reportRouter from "./routers/report.js";
// import analyticsRouter from "./routers/analytics.js";
import homeRouter from "./routers/home.js";
import { socketAuth } from "./middleware/auth.js";
import studyRoomRouter from "./routers/studyRoom.js";
import tutorRouter from "./routers/tutorRouter.js";
import ratingsRouter from "./routers/ratings.js";
import helpRequestRouter from "./routers/askHelp.js";
import indexRouter from "./routers/admin-routers/index.js";

import hbs from "hbs";
import path from "path";

const app = express();

import http from "http";
import { Server } from "socket.io";

const server = http.createServer(app);
const io = new Server(server);

import socketController from "./controllers/socketControllers.js";
io.use(socketAuth);
socketController(io);

const __dirname = path.resolve();
const viewsPath = path.join(__dirname, "templates", "views");
const partialsPath = path.join(__dirname, "templates", "partials");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

app.set("view engine", "hbs");
app.set("views", viewsPath);
app.use(express.static(__dirname + "/public"));
hbs.registerPartials(partialsPath);

app.set("socketio", io);
app.use(express.json());
app.use(userRouter);
app.use(tutorApplicationRouter);
// app.use(reportRouter);
// app.use(analyticsRouter);
app.use(homeRouter);
app.use(studyRoomRouter);
app.use(tutorRouter);
app.use(ratingsRouter);
app.use(helpRequestRouter);
app.use(indexRouter);

export default server;
