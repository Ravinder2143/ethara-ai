import express from "express";
import { login, register, getProfile, updateProfile } from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();
router.post("/login", login);
router.post("/register", register);
router.route("/profile").get(protect, getProfile).put(protect, updateProfile);

export default router;
