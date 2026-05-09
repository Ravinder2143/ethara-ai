import { useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  ArrowLeft,
  Calendar,
  FolderKanban,
  User as UserIcon,
  MessageSquare,
  Paperclip,
  Trash2,
  Send,
  File,
  Edit2,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../utils/api";
import { useAuth } from "../../context/AuthContext";
import Badge from "../../components/ui/Badge";

export default function TaskDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const qc = useQueryClient();
  const fileInputRef = useRef(null);

  const [commentText, setCommentText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [showEditTaskModal, setShowEditTaskModal] = useState(false);

  const { data: task, isLoading: taskLoading } = useQuery({
    queryKey: ["task", id],
    queryFn: () => api.get(`/tasks/${id}`).then((r) => r.data),
  });

  const { data: comments = [], isLoading: commentsLoading } = useQuery({
    queryKey: ["comments", id],
    queryFn: () => api.get(`/tasks/${id}/comments`).then((r) => r.data),
  });

  const updateStatus = useMutation({
    mutationFn: (status) => api.patch(`/tasks/${id}/status`, { status }),
    onSuccess: () => {
      qc.invalidateQueries(["task", id]);
      toast.success("Status updated");
    },
  });

  const addComment = useMutation({
    mutationFn: (text) => api.post(`/tasks/${id}/comments`, { text }),
    onSuccess: () => {
      setCommentText("");
      qc.invalidateQueries(["comments", id]);
    },
  });

  const deleteComment = useMutation({
    mutationFn: (commentId) => api.delete(`/tasks/${id}/comments/${commentId}`),
    onSuccess: () => qc.invalidateQueries(["comments", id]),
  });

  const uploadFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setUploading(true);
    try {
      await api.post(`/tasks/${id}/files`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("File uploaded");
      qc.invalidateQueries(["task", id]);
    } catch (error) {
      // handled by interceptor
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const deleteFile = useMutation({
    mutationFn: (fileId) => api.delete(`/tasks/${id}/files/${fileId}`),
    onSuccess: () => qc.invalidateQueries(["task", id]),
  });

  if (taskLoading) return <DetailSkeleton />;
  if (!task) return <div className="text-white">Task not found</div>;

  const isOverdue = task.status !== "done" && task.dueDate && new Date(task.dueDate) < new Date();

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <button
          onClick={() => navigate(-1)}
          className="mt-1 w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:border-white/20 transition flex-shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <h2 className="text-2xl font-bold text-white break-words max-w-full">{task.title}</h2>
            <Badge label={isOverdue ? "Overdue" : task.status.replace("_", " ")} type={isOverdue ? "overdue" : task.status} />
            <Badge label={task.priority} type={task.priority} />
            {user?.role === "admin" && (
              <button
                onClick={() => setShowEditTaskModal(true)}
                className="ml-auto flex items-center gap-1.5 text-sm font-medium text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg transition"
              >
                <Edit2 className="w-3.5 h-3.5" /> Edit Task
              </button>
            )}
          </div>
          <p className="text-slate-400 text-sm whitespace-pre-wrap break-words">
            {task.description || "No description provided."}
          </p>
        </div>

        {/* Status Dropdown */}
        <select
          value={task.status}
          onChange={(e) => updateStatus.mutate(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm font-medium text-white focus:outline-none focus:border-indigo-500 transition cursor-pointer"
        >
          <option value="todo" className="bg-[#1a1a2e]">Todo</option>
          <option value="in_progress" className="bg-[#1a1a2e]">In Progress</option>
          <option value="done" className="bg-[#1a1a2e]">Done</option>
        </select>
      </div>

      {/* Grid Layout for details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Content (Left) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Files Section */}
          <div className="bg-[#1a1a2e]/60 border border-white/5 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <Paperclip className="w-4 h-4 text-indigo-400" />
                Attachments ({task.files?.length || 0})
              </h3>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-1.5 text-sm text-indigo-400 hover:text-indigo-300 font-medium transition"
              >
                {uploading ? "Uploading..." : "+ Add File"}
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={uploadFile}
                className="hidden"
              />
            </div>

            {task.files?.length === 0 ? (
              <div className="py-6 text-center text-slate-500 text-sm border border-dashed border-white/10 rounded-xl">
                No files attached to this task.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {task.files?.map((file) => (
                  <div key={file._id} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 group">
                    <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                      <File className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <a href={`http://localhost:5000${file.path}`} target="_blank" rel="noreferrer" className="text-sm font-medium text-white truncate hover:underline block">
                        {file.originalName}
                      </a>
                      <span className="text-xs text-slate-500">{format(new Date(file.uploadedAt), "MMM d, yyyy")}</span>
                    </div>
                    <button
                      onClick={() => deleteFile.mutate(file._id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition flex-shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Comments Section */}
          <div className="bg-[#1a1a2e]/60 border border-white/5 rounded-2xl p-6 flex flex-col h-[500px]">
            <h3 className="text-white font-semibold flex items-center gap-2 mb-4">
              <MessageSquare className="w-4 h-4 text-indigo-400" />
              Comments ({comments.length})
            </h3>

            {/* Comments List */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-2 mb-4 custom-scrollbar">
              {commentsLoading ? (
                <div className="text-slate-500 text-sm animate-pulse">Loading comments...</div>
              ) : comments.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-500 text-sm">
                  No comments yet. Start the conversation!
                </div>
              ) : (
                comments.map((comment) => (
                  <div key={comment._id} className="flex gap-3 group">
                    <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-1">
                      {comment.user?.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="bg-white/5 border border-white/5 rounded-2xl rounded-tl-none p-3.5">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-sm font-medium text-white">{comment.user?.name}</span>
                          <span className="text-xs text-slate-500">
                            {format(new Date(comment.createdAt), "MMM d, h:mm a")}
                          </span>
                        </div>
                        <p className="text-slate-300 text-sm whitespace-pre-wrap">{comment.text}</p>
                      </div>
                      {(user._id === comment.user?._id || user.role === "admin") && (
                        <button
                          onClick={() => deleteComment.mutate(comment._id)}
                          className="text-xs text-slate-500 hover:text-red-400 mt-1.5 ml-2 opacity-0 group-hover:opacity-100 transition"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Add Comment Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (commentText.trim()) addComment.mutate(commentText);
              }}
              className="flex gap-2 relative mt-auto pt-4 border-t border-white/5"
            >
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Write a comment..."
                className="flex-1 bg-white/5 border border-white/10 rounded-xl pl-4 pr-12 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition"
              />
              <button
                type="submit"
                disabled={!commentText.trim() || addComment.isPending}
                className="absolute right-2 top-1/2 -translate-y-1/2 mt-2 w-8 h-8 flex items-center justify-center rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white transition"
              >
                <Send className="w-4 h-4 ml-0.5" />
              </button>
            </form>
          </div>
        </div>

        {/* Sidebar Info (Right) */}
        <div className="space-y-6">
          <div className="bg-[#1a1a2e]/60 border border-white/5 rounded-2xl p-6">
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider text-slate-500">
              Task Details
            </h3>
            
            <div className="space-y-4">
              <div>
                <span className="text-xs text-slate-500 block mb-1">Project</span>
                <div className="flex items-center gap-2 text-sm text-white">
                  <FolderKanban className="w-4 h-4 text-indigo-400" />
                  {task.project?.name || "None"}
                </div>
              </div>

              <div>
                <span className="text-xs text-slate-500 block mb-1">Assigned To</span>
                <div className="flex items-center gap-2 text-sm text-white">
                  <UserIcon className="w-4 h-4 text-indigo-400" />
                  {task.assignedTo?.name || "Unassigned"}
                </div>
              </div>

              <div>
                <span className="text-xs text-slate-500 block mb-1">Due Date</span>
                <div className="flex items-center gap-2 text-sm text-white">
                  <Calendar className="w-4 h-4 text-indigo-400" />
                  <span className={isOverdue ? "text-red-400 font-medium" : ""}>
                    {task.dueDate ? format(new Date(task.dueDate), "MMM d, yyyy") : "No due date"}
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-white/5">
                <span className="text-xs text-slate-500 block mb-1">Created At</span>
                <div className="text-sm text-slate-300">
                  {format(new Date(task.createdAt), "MMM d, yyyy h:mm a")}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {showEditTaskModal && (
        <EditTaskModal
          task={task}
          members={task.project?.members || []}
          onClose={() => setShowEditTaskModal(false)}
          onSuccess={() => {
            qc.invalidateQueries(["task", id]);
            setShowEditTaskModal(false);
          }}
        />
      )}
    </div>
  );
}

// ── Edit Task Modal ───────────────────────────────────────
import { useForm } from "react-hook-form";

function EditTaskModal({ task, members, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      title: task.title,
      description: task.description,
      priority: task.priority,
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : "",
      assignedTo: task.assignedTo?._id || "",
    }
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await api.put(`/tasks/${task._id}`, data);
      toast.success("Task updated! ✅");
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
        <h2 className="text-xl font-bold text-white mb-6">Edit Task</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Title</label>
            <input
              type="text"
              className={`w-full bg-white/5 border ${errors.title ? "border-red-500" : "border-white/10"} rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition`}
              {...register("title", { required: "Title is required" })}
            />
            {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
            <textarea
              rows={2}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition resize-none"
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
            <button type="submit" disabled={loading} className="flex-1 px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium transition">
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-6 animate-pulse max-w-5xl mx-auto">
      <div className="h-8 w-64 bg-white/5 rounded-xl" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="h-48 bg-white/5 rounded-2xl" />
          <div className="h-[500px] bg-white/5 rounded-2xl" />
        </div>
        <div className="h-64 bg-white/5 rounded-2xl" />
      </div>
    </div>
  );
}
