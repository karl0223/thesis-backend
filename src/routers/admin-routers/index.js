import express from "express";

import { authAdmin } from "../../middleware/auth.js";
import {
  adminHome,
  login,
  loginFunction,
  logout,
} from "../../controllers/admin-controllers/index.js";

const indexRouter = express.Router();

indexRouter.get("/login", login);

indexRouter.post("/login", loginFunction);

indexRouter.get("/admin", authAdmin, adminHome);

indexRouter.get("/admin/logout", authAdmin, logout);

export default indexRouter;
