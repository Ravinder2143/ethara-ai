import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import {
  ArrowLeft,
  Plus,
  UserPlus,
  Trash2,
  CheckSquare,
  Clock,
  AlertTriangle,
  User,
  Edit2,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import { format } from "date-fns";
import api from "../../utils/api";
import { useAuth } from "../../context/AuthContext";
import Badge from "../../components/ui/Badge";

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [showEditProjectModal, setShowEditProjectModal] = useState(false);

  const { data: project, isLoading } = useQuery({
    queryKey: ["project", id],
    queryFn: () => api.get(`/projects/${id}`).then((r) => r.data),
  });

  const deleteTask = useMutation({
    mutationFn: (tid) => api.delete(`/tasks/${tid}`),
    onSuccess: () => {
      qc.invalidateQueries(["project", id]);
      toast.success("Task deleted");
    },
  });

  const updateStatus = useMutation({
    mutationFn: ({ tid, status }) => api.patch(`/tasks/${tid}/status`, { status }),
    onSuccess: () => qc.invalidateQueries(["project", id]),
  });

  const removeMember = useMutation({
    mutationFn: (memberId) => api.delete(`/projects/${id}/members/${memberId}`),
    onSuccess: () => {
      qc.invalidateQueries(["project", id]);
      toast.success("Member removed");
    },
  });

  if (isLoading) return <DetailSkeleton />;
  if (!project) return <div className="text-white">Project not found</div>;

  const grouped = {
    todo: project.tasks?.filter((t) => t.status === "todo") || [],
    in_progress: project.tasks?.filter((t) => t.status === "in_progress") || [],
    done: project.tasks?.filter((t) => t.status === "done") || [],
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <button
          onClick={() => navigate("/projects")}
          className="mt-1 w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:border-white/20 transition"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-white">{project.name}</h2>
          <p className="text-slate-400 text-sm mt-1">
            {project.description || "No description"}
          </p>
        </div>
        {user?.role === "admin" && (
          <div className="flex gap-2 flex-wrap justify-end">
            <button
              onClick={() => setShowEditProjectModal(true)}
              className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 px-3 py-2 rounded-xl text-sm font-medium transition"
            >
              <Edit2 className="w-4 h-4" />
              Edit Project
            </button>
            <button
              onClick={() => setShowMemberModal(true)}
              className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 px-3 py-2 rounded-xl text-sm font-medium transition"
            >
              <UserPlus className="w-4 h-4" />
              Add Member
            </button>
            <button
              onClick={() => setShowTaskModal(true)}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-2 rounded-xl text-sm font-medium transition shadow-lg shadow-indigo-500/25"
            >
              <Plus className="w-4 h-4" />
              Add Task
            </button>
          </div>
        )}
      </div>

      {/* Members */}
      <div className="bg-[#1a1a2e]/60 border border-white/5 rounded-2xl p-5">
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
          <User className="w-4 h-4 text-indigo-400" /> Team Members
        </h3>
        <div className="flex flex-wrap gap-2">
          {project.members?.map((m) => (
            <div key={m._id} className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
              <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                {m.name?.charAt(0).toUpperCase()}
              </div>
              <span className="text-slate-300 text-sm">{m.name}</span>
              <Badge label={m.role} type={m.role} />
              {user?.role === "admin" && (
                <button
                  onClick={() => removeMember.mutate(m._id)}
                  className="ml-1 text-slate-500 hover:text-red-400 transition"
                  title="Remove member"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
          {project.members?.length === 0 && (
            <p className="text-slate-500 text-sm">No members yet</p>
          )}
        </div>
      </div>

      {/* Kanban Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <KanbanCol
          title="Todo"
          icon={<CheckSquare className="w-4 h-4 text-slate-400" />}
          tasks={grouped.todo}
          status="todo"
          isAdmin={user?.role === "admin"}
          onDelete={(tid) => deleteTask.mutate(tid)}
          onStatusChange={(tid, s) => updateStatus.mutate({ tid, status: s })}
        />
        <KanbanCol
          title="In Progress"
          icon={<Clock className="w-4 h-4 text-blue-400" />}
          tasks={grouped.in_progress}
          status="in_progress"
          isAdmin={user?.role === "admin"}
          onDelete={(tid) => deleteTask.mutate(tid)}
          onStatusChange={(tid, s) => updateStatus.mutate({ tid, status: s })}
        />
        <KanbanCol
          title="Done"
          icon={<AlertTriangle className="w-4 h-4 text-green-400" />}
          tasks={grouped.done}
          status="done"
          isAdmin={user?.role === "admin"}
          onDelete={(tid) => deleteTask.mutate(tid)}
          onStatusChange={(tid, s) => updateStatus.mutate({ tid, status: s })}
        />
      </div>

      {/* Modals */}
      {showTaskModal && (
        <CreateTaskModal
          projectId={id}
          members={project.members || []}
          onClose={() => setShowTaskModal(false)}
          onSuccess={() => {
            qc.invalidateQueries(["project", id]);
            setShowTaskModal(false);
          }}
        />
      )}
      {showMemberModal && (
        <AddMemberModal
          projectId={id}
          onClose={() => setShowMemberModal(false)}
          onSuccess={() => {
            qc.invalidateQueries(["project", id]);
            setShowMemberModal(false);
          }}
        />
      )}
      {showEditProjectModal && (
        <EditProjectModal
          project={project}
          onClose={() => setShowEditProjectModal(false)}
          onSuccess={() => {
            qc.invalidateQueries(["project", id]);
            setShowEditProjectModal(false);
          }}
        />
      )}
    </div>
  );
}

// ── Kanban Column ─────────────────────────────────────────
function KanbanCol({ title, icon, tasks, isAdmin, onDelete, onStatusChange }) {
  const colColors = {
    Todo: "border-slate-500/20",
    "In Progress": "border-blue-500/20",
    Done: "border-green-500/20",
  };

  return (
    <div className={`bg-[#1a1a2e]/60 border ${colColors[title] || "border-white/5"} rounded-2xl p-4 flex flex-col gap-3`}>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-white font-semibold text-sm">{title}</span>
        </div>
        <span className="text-xs text-slate-500 bg-white/5 px-2 py-0.5 rounded-full">{tasks.length}</span>
      </div>

      {tasks.length === 0 ? (
        <div className="text-center py-8 text-slate-600 text-sm">No tasks</div>
      ) : (
        tasks.map((task) => (
          <TaskCard
            key={task._id}
            task={task}
            isAdmin={isAdmin}
            onDelete={() => onDelete(task._id)}
            onStatusChange={(s) => onStatusChange(task._id, s)}
          />
        ))
      )}
    </div>
  );
}

// ── Task Card ─────────────────────────────────────────────
function TaskCard({ task, isAdmin, onDelete, onStatusChange }) {
  const isOverdue = task.status !== "done" && task.dueDate && new Date(task.dueDate) < new Date();

  return (
    <div className="bg-white/3 hover:bg-white/5 border border-white/5 hover:border-indigo-500/20 rounded-xl p-3.5 group transition-all duration-200">
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-white text-sm font-medium leading-snug flex-1">{task.title}</p>
        {isAdmin && (
          <button
            onClick={onDelete}
            className="opacity-0 group-hover:opacity-100 flex-shrink-0 text-slate-500 hover:text-red-400 transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {task.description && <p className="text-slate-500 text-xs mb-3 line-clamp-2">{task.description}</p>}

      <div className="flex items-center justify-between gap-2">
        <Badge label={isOverdue ? "Overdue" : task.priority} type={isOverdue ? "overdue" : task.priority} />
        {task.dueDate && <span className="text-xs text-slate-500">{format(new Date(task.dueDate), "MMM d")}</span>}
      </div>

      {task.assignedTo && (
        <div className="flex items-center gap-1.5 mt-2.5 pt-2.5 border-t border-white/5">
          <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">
            {task.assignedTo?.name?.charAt(0).toUpperCase()}
          </div>
          <span className="text-xs text-slate-400">{task.assignedTo?.name}</span>
        </div>
      )}

      <select
        value={task.status}
        onChange={(e) => onStatusChange(e.target.value)}
        className="mt-2.5 w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 transition cursor-pointer"
      >
        <option value="todo" className="bg-[#1a1a2e]">Todo</option>
        <option value="in_progress" className="bg-[#1a1a2e]">In Progress</option>
        <option value="done" className="bg-[#1a1a2e]">Done</option>
      </select>
    </div>
  );
}

// ── Create Task Modal ─────────────────────────────────────
function CreateTaskModal({ projectId, members, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await api.post("/tasks", { ...data, project: projectId });
      toast.success("Task created! ✅");
      onSuccess();
    } catch (err) {
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#1a1a2e] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <h2 className="text-xl font-bold text-white mb-6">Create Task</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Title</label>
            <input
              type="text"
              placeholder="Task title"
              className={`w-full bg-white/5 border ${errors.title ? "border-red-500" : "border-white/10"} rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition`}
              {...register("title", { required: "Title is required" })}
            />
            {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
            <textarea
              rows={2}
              placeholder="Optional description"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition resize-none"
              {...register("description")}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Priority</label>
              <select
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition"
                {...register("priority")}
              >
                <option value="low" className="bg-[#1a1a2e]">Low</option>
                <option value="medium" className="bg-[#1a1a2e]">Medium</option>
                <option value="high" className="bg-[#1a1a2e]">High</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Due Date</label>
              <input
                type="date"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition"
                {...register("dueDate")}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Assign To</label>
            <select
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition"
              {...register("assignedTo")}
            >
              <option value="" className="bg-[#1a1a2e]">Unassigned</option>
              {members.map((m) => (
                <option key={m._id} value={m._id} className="bg-[#1a1a2e]">{m.name}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-3 rounded-xl border border-white/10 text-slate-400 hover:text-white text-sm font-medium transition">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="flex-1 px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium transition flex items-center justify-center gap-2">
              {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Plus className="w-4 h-4" />Create</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Add Member Modal ──────────────────────────────────────
function AddMemberModal({ projectId, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await api.post(`/projects/${projectId}/members`, { email: data.email });
      toast.success("Member added! 👥");
      onSuccess();
    } catch (err) {
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#1a1a2e] border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <h2 className="text-xl font-bold text-white mb-6">Add Member</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Member Email</label>
            <input
              type="email"
              placeholder="member@example.com"
              className={`w-full bg-white/5 border ${errors.email ? "border-red-500" : "border-white/10"} rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition`}
              {...register("email", { required: "Email is required" })}
            />
            {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-3 rounded-xl border border-white/10 text-slate-400 hover:text-white text-sm font-medium transition">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="flex-1 px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium transition flex items-center justify-center gap-2">
              {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><UserPlus className="w-4 h-4" />Add</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Edit Project Modal ────────────────────────────────────
function EditProjectModal({ project, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      name: project.name,
      description: project.description,
    }
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await api.put(`/projects/${project._id}`, data);
      toast.success("Project updated! ✅");
      onSuccess();
    } catch (err) {
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#1a1a2e] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <h2 className="text-xl font-bold text-white mb-6">Edit Project</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Project Name</label>
            <input
              type="text"
              className={`w-full bg-white/5 border ${errors.name ? "border-red-500" : "border-white/10"} rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition`}
              {...register("name", { required: "Name is required" })}
            />
            {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
            <textarea
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition resize-none"
              {...register("description")}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-3 rounded-xl border border-white/10 text-slate-400 hover:text-white text-sm font-medium transition">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="flex-1 px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium transition">
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────
function DetailSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-64 bg-white/5 rounded-xl" />
      <div className="h-24 bg-white/5 rounded-2xl" />
      <div className="grid grid-cols-3 gap-5">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-64 bg-white/5 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
