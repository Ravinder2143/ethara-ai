import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { getCommentsByTask, addComment, deleteComment } from "../controllers/commentController.js";

const router = express.Router({ mergeParams: true });

// Mounted at /api/tasks/:taskId/comments
router.route("/").get(protect, getCommentsByTask).post(protect, addComment);
router.route("/:id").delete(protect, deleteComment);

export default router;
