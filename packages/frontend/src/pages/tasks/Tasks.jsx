import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CheckSquare, Calendar, FolderKanban, Clock, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../utils/api";
import { format } from "date-fns";
import Badge from "../../components/ui/Badge";

export default function Tasks() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState("all");

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["myTasks"],
    queryFn: () => api.get("/tasks").then((res) => res.data),
  });

  if (isLoading) return <TasksSkeleton />;

  const filteredTasks = tasks.filter((task) => {
    if (filter === "all") return true;
    if (filter === "overdue") {
      return task.status !== "done" && task.dueDate && new Date(task.dueDate) < new Date();
    }
    return task.status === filter;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">My Tasks</h2>
          <p className="text-slate-400 text-sm mt-1">Manage all your assigned and project tasks.</p>
        </div>

        <div className="flex bg-[#1a1a2e]/80 border border-white/5 rounded-xl p-1">
          {["all", "todo", "in_progress", "done", "overdue"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                filter === f
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/25"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {f.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {filteredTasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center mb-4">
            <CheckSquare className="w-7 h-7 text-indigo-400" />
          </div>
          <h3 className="text-white font-semibold text-lg mb-2">No tasks found</h3>
          <p className="text-slate-400 text-sm">You don't have any tasks matching this filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredTasks.map((task) => {
            const isOverdue = task.status !== "done" && task.dueDate && new Date(task.dueDate) < new Date();
            
            return (
              <div 
                key={task._id} 
                onClick={() => navigate(`/tasks/${task._id}`)}
                className="bg-[#1a1a2e]/60 border border-white/5 hover:border-indigo-500/30 rounded-2xl p-5 flex flex-col md:flex-row md:items-center gap-4 transition-all duration-200 cursor-pointer group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className={`text-lg font-semibold truncate ${task.status === "done" ? "text-slate-400 line-through" : "text-white group-hover:text-indigo-400 transition-colors"}`}>
                      {task.title}
                    </h3>
                    <Badge label={isOverdue ? "Overdue" : task.status.replace("_", " ")} type={isOverdue ? "overdue" : task.status} />
                    <Badge label={task.priority} type={task.priority} />
                  </div>
                  {task.description && (
                    <p className="text-slate-500 text-sm line-clamp-1">{task.description}</p>
                  )}
                </div>

                <div className="flex items-center gap-6 flex-wrap md:flex-nowrap">
                  {task.project && (
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <FolderKanban className="w-4 h-4 text-slate-500" />
                      <span className="truncate max-w-[120px]">{task.project.name}</span>
                    </div>
                  )}

                  {task.dueDate && (
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <Calendar className="w-4 h-4 text-slate-500" />
                      <span className={isOverdue ? "text-red-400 font-medium" : ""}>
                        {format(new Date(task.dueDate), "MMM d, yyyy")}
                      </span>
                    </div>
                  )}

                  <button className="hidden md:flex items-center justify-center w-10 h-10 rounded-xl bg-white/5 text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                    <Eye className="w-5 h-5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function TasksSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-64 bg-white/5 rounded-xl" />
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-24 bg-white/5 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
