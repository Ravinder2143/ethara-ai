import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import connectDB from "./packages/backend/config/db.js";
import authRoutes from "./packages/backend/routes/auth.js";
import projectRoutes from "./packages/backend/routes/projects.js";
import taskRoutes from "./packages/backend/routes/tasks.js";
import dashboardRoutes from "./packages/backend/routes/dashboard.js";
import userRoutes from "./packages/backend/routes/users.js";

// Load env from backend folder
dotenv.config({ path: "./packages/backend/.env" });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
connectDB();

// Update uploads path
app.use("/uploads", express.static(path.join(__dirname, "packages/backend/uploads")));

app.use(express.json());
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);

app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/users", userRoutes);

// Serve Static Frontend Files in Production
const frontendDist = path.join(__dirname, "packages/frontend/dist");
app.use(express.static(frontendDist));

app.get("*", (req, res) => {
  res.sendFile(path.join(frontendDist, "index.html"));
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || "Server Error" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
