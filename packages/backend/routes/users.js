import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { getAllUsers, updateUserRole } from "../controllers/userController.js";

const router = express.Router();

router.get("/", protect, getAllUsers);
router.patch("/:id/role", protect, updateUserRole);

export default router;
