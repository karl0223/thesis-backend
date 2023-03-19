const express = require("express");
require("dotenv").config();
require("./db/mongoose");
const userRouter = require("./routers/user");
const postRouter = require("./routers/post");
const tutorApplicationRouter = require("./routers/tutorApplication");

const app = express();

app.use(express.json());
app.use(userRouter);
app.use(postRouter);
app.use(tutorApplicationRouter);

module.exports = app;
