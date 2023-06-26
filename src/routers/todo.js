import express from "express";
import { auth } from "../middleware/auth.js";
import {
  getTodoList,
  createTodoList,
  updateTodo,
  deleteTodo,
} from "../controllers/todoControllers.js";

const todoRouter = express.Router();

todoRouter.get("/api/todo/:roomId", auth, getTodoList);

todoRouter.post("/api/todo/create", auth, createTodoList);

todoRouter.patch("/api/todo/update", auth, updateTodo);

todoRouter.delete("/api/todo/delete", auth, deleteTodo);

export default todoRouter;
