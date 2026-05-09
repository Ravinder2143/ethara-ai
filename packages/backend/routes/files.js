import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { upload, uploadFile, deleteFile } from "../controllers/fileController.js";

const router = express.Router({ mergeParams: true });

// Mounted at /api/tasks/:taskId/files
router.post("/", protect, upload.single("file"), uploadFile);
router.delete("/:fileId", protect, deleteFile);

export default router;
