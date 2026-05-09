import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { getProjects, createProject, getProjectById, addMember, removeMember, updateProject, deleteProject } from "../controllers/projectController.js";

const router = express.Router();
router.route("/").get(protect, getProjects).post(protect, createProject);
router.route("/:id").get(protect, getProjectById).put(protect, updateProject).delete(protect, deleteProject);
router.post("/:id/members", protect, addMember);
router.delete("/:id/members/:memberId", protect, removeMember);

export default router;
