import express from "express";

import { adminHome, login } from "../../controllers/admin-controllers/index.js";

const indexRouter = express.Router();

indexRouter.get("/admin/login", login);

indexRouter.get("/admin", adminHome);

export default indexRouter;
