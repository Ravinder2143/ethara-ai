import Project from "../models/Project.js";
import Task from "../models/Task.js";

export const getStats = async (req, res) => {
  const query = req.user.role === "admin" ? {} : { members: req.user._id };
  const projects = await Project.find(query);
  const projectIds = projects.map((project) => project._id);

  const taskQuery = req.user.role === "admin" ? {} : { project: { $in: projectIds } };
  const tasks = await Task.find(taskQuery);
  const totalTasks = tasks.length;
  const done = tasks.filter((task) => task.status === "done").length;
  const inProgress = tasks.filter((task) => task.status === "in_progress").length;
  const todo = tasks.filter((task) => task.status === "todo").length;
  const overdue = tasks.filter((task) => task.status !== "done" && task.dueDate && new Date(task.dueDate) < new Date()).length;

  res.json({
    totalProjects: projects.length,
    totalTasks,
    done,
    inProgress,
    todo,
    overdue,
  });
};

export const getRecentTasks = async (req, res) => {
  const query = req.user.role === "admin" ? {} : { members: req.user._id };
  const projects = await Project.find(query);
  const projectIds = projects.map((project) => project._id);

  const taskQuery = req.user.role === "admin" ? {} : { project: { $in: projectIds } };
  const tasks = await Task.find(taskQuery)
    .populate("project", "name")
    .populate("assignedTo", "name")
    .sort({ createdAt: -1 })
    .limit(5);

  res.json(tasks);
};
