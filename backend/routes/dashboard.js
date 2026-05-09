import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { getStats, getRecentTasks } from "../controllers/dashboardController.js";

const router = express.Router();
router.get("/stats", protect, getStats);
router.get("/recent-tasks", protect, getRecentTasks);

export default router;
