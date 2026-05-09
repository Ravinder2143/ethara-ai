import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, FolderKanban, Users, CheckSquare, Trash2, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import api from "../../utils/api";
import { useAuth } from "../../context/AuthContext";
import { format } from "date-fns";

export default function Projects() {
  const [showModal, setShowModal] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: () => api.get("/projects").then((r) => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/projects/${id}`),
    onSuccess: () => {
      qc.invalidateQueries(["projects"]);
      toast.success("Project deleted");
    },
  });

  if (isLoading) return <ProjectsSkeleton />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Projects</h2>
          <p className="text-slate-400 text-sm mt-1">
            {projects.length} project{projects.length !== 1 ? "s" : ""} total
          </p>
        </div>
        {user?.role === "admin" && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 shadow-lg shadow-indigo-500/25"
          >
            <Plus className="w-4 h-4" />
            New Project
          </button>
        )}
      </div>

      {/* Grid */}
      {projects.length === 0 ? (
        <EmptyProjects onAdd={() => setShowModal(true)} isAdmin={user?.role === "admin"} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {projects.map((p) => (
            <ProjectCard
              key={p._id}
              project={p}
              isAdmin={user?.role === "admin"}
              onView={() => navigate(`/projects/${p._id}`)}
              onDelete={() => deleteMutation.mutate(p._id)}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <CreateProjectModal
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            qc.invalidateQueries(["projects"]);
            setShowModal(false);
          }}
        />
      )}
    </div>
  );
}

// ── Project Card ─────────────────────────────────────────
function ProjectCard({ project, isAdmin, onView, onDelete }) {
  const done = project.tasks?.filter((t) => t.status === "done").length || 0;
  const total = project.tasks?.length || 0;
  const pct = total ? Math.round((done / total) * 100) : 0;

  return (
    <div className="bg-[#1a1a2e]/60 border border-white/5 rounded-2xl p-5 hover:border-indigo-500/20 transition-all duration-200 group flex flex-col gap-4">
      {/* Top */}
      <div className="flex items-start justify-between">
        <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/20 flex items-center justify-center">
          <FolderKanban className="w-5 h-5 text-indigo-400" />
        </div>
        {isAdmin && (
          <button
            onClick={onDelete}
            className="opacity-0 group-hover:opacity-100 w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Info */}
      <div>
        <h3 className="text-white font-semibold text-lg leading-tight">{project.name}</h3>
        <p className="text-slate-400 text-sm mt-1 line-clamp-2">
          {project.description || "No description provided."}
        </p>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-4 text-sm text-slate-400">
        <span className="flex items-center gap-1.5">
          <CheckSquare className="w-4 h-4" />
          {total} tasks
        </span>
        <span className="flex items-center gap-1.5">
          <Users className="w-4 h-4" />
          {project.members?.length || 0} members
        </span>
      </div>

      {/* Progress */}
      <div>
        <div className="flex justify-between text-xs mb-1.5">
          <span className="text-slate-500">Progress</span>
          <span className="text-white font-medium">{pct}%</span>
        </div>
        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-green-500 rounded-full transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-white/5">
        <span className="text-xs text-slate-500">
          {format(new Date(project.createdAt), "MMM d, yyyy")}
        </span>
        <button
          onClick={onView}
          className="flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 text-sm font-medium transition"
        >
          <Eye className="w-4 h-4" />
          View
        </button>
      </div>
    </div>
  );
}

// ── Create Project Modal ──────────────────────────────────
function CreateProjectModal({ onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await api.post("/projects", data);
      toast.success("Project created! 🎉");
      onSuccess();
    } catch (err) {
      // handled
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#1a1a2e] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <h2 className="text-xl font-bold text-white mb-6">Create New Project</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Project Name</label>
            <input
              type="text"
              placeholder="e.g. Website Redesign"
              className={`w-full bg-white/5 border ${errors.name ? "border-red-500" : "border-white/10"} rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition`}
              {...register("name", { required: "Project name is required" })}
            />
            {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
            <textarea
              placeholder="What is this project about?"
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition resize-none"
              {...register("description")}
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:border-white/20 text-sm font-medium transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium transition flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <><Plus className="w-4 h-4" /> Create</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Empty State ───────────────────────────────────────────
function EmptyProjects({ onAdd, isAdmin }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center mb-4">
        <FolderKanban className="w-7 h-7 text-indigo-400" />
      </div>
      <h3 className="text-white font-semibold text-lg mb-2">No projects yet</h3>
      <p className="text-slate-400 text-sm mb-6">
        {isAdmin ? "Create your first project to get started." : "You haven't been added to any project yet."}
      </p>
      {isAdmin && (
        <button
          onClick={onAdd}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition"
        >
          <Plus className="w-4 h-4" /> Create Project
        </button>
      )}
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────
function ProjectsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-48 bg-white/5 rounded-xl" />
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-52 bg-white/5 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
