import Project from "../models/Project.js";
import User from "../models/User.js";

export const getProjects = async (req, res) => {
  const query = req.user.role === "admin" ? {} : { members: req.user._id };
  const projects = await Project.find(query)
    .populate("members", "name email role")
    .populate({ path: "tasks", select: "title status" });
  res.json(projects);
};

export const createProject = async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Only admins can create projects" });
  }

  const { name, description } = req.body;
  if (!name) {
    return res.status(400).json({ message: "Project name is required" });
  }

  const project = await Project.create({
    name,
    description,
    members: [req.user._id],
    createdBy: req.user._id,
  });

  res.status(201).json(project);
};

export const getProjectById = async (req, res) => {
  const project = await Project.findById(req.params.id)
    .populate("members", "name email role")
    .populate({ path: "tasks", populate: { path: "assignedTo", select: "name" } });

  if (!project) {
    return res.status(404).json({ message: "Project not found" });
  }

  if (req.user.role !== "admin" && !project.members.some((member) => member._id.equals(req.user._id))) {
    return res.status(403).json({ message: "Not authorized" });
  }

  res.json(project);
};

export const addMember = async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Only admins can add members" });
  }

  const { email } = req.body;
  const project = await Project.findById(req.params.id);
  if (!project) {
    return res.status(404).json({ message: "Project not found" });
  }

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  if (project.members.some((member) => member.equals(user._id))) {
    return res.status(400).json({ message: "User is already a member" });
  }

  project.members.push(user._id);
  await project.save();

  res.json({ message: "Member added" });
};

export const removeMember = async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Only admins can remove members" });
  }

  const project = await Project.findById(req.params.id);
  if (!project) {
    return res.status(404).json({ message: "Project not found" });
  }

  const memberId = req.params.memberId;
  project.members.pull(memberId);
  await project.save();

  res.json({ message: "Member removed" });
};

export const updateProject = async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Only admins can update projects" });
  }

  const { name, description } = req.body;
  const project = await Project.findById(req.params.id);
  
  if (!project) {
    return res.status(404).json({ message: "Project not found" });
  }

  if (name) project.name = name;
  if (description !== undefined) project.description = description;

  await project.save();
  res.json(project);
};

export const deleteProject = async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Only admins can delete projects" });
  }

  const project = await Project.findById(req.params.id);
  if (!project) {
    return res.status(404).json({ message: "Project not found" });
  }

  await project.deleteOne();
  res.json({ message: "Project deleted" });
};
