import express from "express";

import { webAuth, webAdminAuth } from "../../middleware/webAdminAuth.js";
import {
  adminHome,
  login,
  loginFunction,
  logout,
} from "../../controllers/admin-controllers/index.js";

const indexRouter = express.Router();

indexRouter.get("/login", login);

indexRouter.post("/login", loginFunction);

indexRouter.get("/admin", webAuth, webAdminAuth, adminHome);

indexRouter.get("/admin/logout", webAuth, webAdminAuth, logout);

export default indexRouter;
