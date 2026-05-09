import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { createTask, deleteTask, updateStatus, getMyTasks, getTaskById, updateTask } from "../controllers/taskController.js";
import commentRoutes from "./comments.js";
import fileRoutes from "./files.js";

const router = express.Router();
router.get("/", protect, getMyTasks);
router.post("/", protect, createTask);
router.get("/:id", protect, getTaskById);
router.put("/:id", protect, updateTask);
router.delete("/:id", protect, deleteTask);
router.patch("/:id/status", protect, updateStatus);

// Mount nested routes for comments and files
router.use("/:taskId/comments", commentRoutes);
router.use("/:taskId/files", fileRoutes);

export default router;
