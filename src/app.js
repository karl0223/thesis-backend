// const express = require("express");
// require("dotenv").config();
// require("./db/mongoose");
// const userRouter = require("./routers/user");
// const postRouter = require("./routers/post");
// const tutorApplicationRouter = require("./routers/tutorApplication");

import express from "express";
import dotenv from "dotenv";
dotenv.config();
import "./db/mongoose.js";
import userRouter from "./routers/user.js";
// import postRouter from "./routers/post.js";
import tutorApplicationRouter from "./routers/tutorApplication.js";

const app = express();

app.use(express.json());
app.use(userRouter);
// app.use(postRouter);
app.use(tutorApplicationRouter);

export default app;
