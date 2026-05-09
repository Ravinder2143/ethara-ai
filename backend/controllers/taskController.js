import Task from "../models/Task.js";
import Project from "../models/Project.js";
import User from "../models/User.js";

export const getMyTasks = async (req, res) => {
  try {
    let query = {};
    if (req.user.role !== "admin") {
      const projects = await Project.find({ members: req.user._id });
      const projectIds = projects.map(p => p._id);
      query = { project: { $in: projectIds } };
    }

    const tasks = await Task.find(query)
      .populate("project", "name")
      .populate("assignedTo", "name")
      .sort({ dueDate: 1 });

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch tasks" });
  }
};

export const getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate("project", "name members")
      .populate("assignedTo", "name email");

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Check if user is member of the project
    const project = await Project.findById(task.project._id);
    if (req.user.role !== "admin" && !project.members.some(memberId => memberId.equals(req.user._id))) {
      return res.status(403).json({ message: "Not authorized to view this task" });
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch task" });
  }
};

export const createTask = async (req, res) => {
  const { title, description, priority, dueDate, assignedTo, project } = req.body;
  if (!title || !project) {
    return res.status(400).json({ message: "Title and project are required" });
  }

  const projectDoc = await Project.findById(project);
  if (!projectDoc) {
    return res.status(404).json({ message: "Project not found" });
  }

  if (!projectDoc.members.some((member) => member.equals(req.user._id))) {
    return res.status(403).json({ message: "Not authorized" });
  }

  if (assignedTo) {
    const member = await User.findById(assignedTo);
    if (!member) {
      return res.status(404).json({ message: "Assigned user not found" });
    }
    if (!projectDoc.members.some((memberId) => memberId.equals(member._id))) {
      projectDoc.members.push(member._id);
    }
  }

  const task = await Task.create({
    title,
    description,
    priority: priority || "medium",
    dueDate: dueDate || null,
    assignedTo: assignedTo || null,
    project,
  });

  projectDoc.tasks.push(task._id);
  await projectDoc.save();

  res.status(201).json(task);
};

export const deleteTask = async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) {
    return res.status(404).json({ message: "Task not found" });
  }

  const project = await Project.findById(task.project);
  if (!project.members.some((member) => member.equals(req.user._id))) {
    return res.status(403).json({ message: "Not authorized" });
  }

  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Only admins can delete tasks" });
  }

  project.tasks.pull(task._id);
  await project.save();
  await task.deleteOne();

  res.json({ message: "Task deleted" });
};

export const updateStatus = async (req, res) => {
  const task = await Task.findById(req.params.id).populate("project");
  if (!task) {
    return res.status(404).json({ message: "Task not found" });
  }

  if (!task.project.members.some((member) => member.equals(req.user._id))) {
    return res.status(403).json({ message: "Not authorized" });
  }

  task.status = req.body.status;
  await task.save();
  res.json(task);
};
export const updateTask = async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Only admins can edit tasks" });
  }

  const { title, description, priority, dueDate, assignedTo } = req.body;
  const task = await Task.findById(req.params.id);
  if (!task) {
    return res.status(404).json({ message: "Task not found" });
  }

  if (title) task.title = title;
  if (description !== undefined) task.description = description;
  if (priority) task.priority = priority;
  if (dueDate !== undefined) task.dueDate = dueDate;
  if (assignedTo !== undefined) task.assignedTo = assignedTo || null;

  await task.save();
  res.json(task);
};
