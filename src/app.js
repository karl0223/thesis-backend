const express = require("express");
require("dotenv").config();
require("./db/mongoose");
const userRouter = require("./routers/user");
const postRouter = require("./routers/post")

const app = express();

app.use(express.json());
app.use(userRouter);
app.use(postRouter)

module.exports = app;
