import { useEffect, useState } from "react";
import {
  CheckSquare,
  Clock,
  AlertTriangle,
  FolderKanban,
  TrendingUp,
  Users,
} from "lucide-react";
import StatCard from "../components/ui/StatCard";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { format } from "date-fns";
import Badge from "../components/ui/Badge";

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentTasks, setRecentTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const [statsRes, tasksRes] = await Promise.all([
        api.get("/dashboard/stats"),
        api.get("/dashboard/recent-tasks"),
      ]);
      setStats(statsRes.data);
      setRecentTasks(tasksRes.data);
    } catch (err) {
      // handled by interceptor
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">
            Good {getGreeting()}, {user?.name?.split(" ")[0]} 👋
          </h2>
          <p className="text-slate-400 mt-1 text-sm">
            Here's what's happening with your projects today.
          </p>
        </div>
        <div className="hidden md:block text-right">
          <p className="text-slate-400 text-sm">
            {format(new Date(), "EEEE, MMM d yyyy")}
          </p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Total Projects"
          value={stats?.totalProjects ?? 0}
          icon={FolderKanban}
          color="indigo"
          sub="Active projects"
        />
        <StatCard
          title="Total Tasks"
          value={stats?.totalTasks ?? 0}
          icon={CheckSquare}
          color="blue"
          sub="Across all projects"
        />
        <StatCard
          title="In Progress"
          value={stats?.inProgress ?? 0}
          icon={TrendingUp}
          color="yellow"
          sub="Currently active"
        />
        <StatCard
          title="Overdue"
          value={stats?.overdue ?? 0}
          icon={AlertTriangle}
          color="red"
          sub="Needs attention"
        />
      </div>

      {/* Progress + Recent Tasks */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Task Progress */}
        <div className="xl:col-span-1 bg-[#1a1a2e]/60 border border-white/5 rounded-2xl p-6">
          <h3 className="text-white font-semibold mb-6">Task Overview</h3>
          <div className="space-y-4">
            <ProgressItem
              label="Completed"
              value={stats?.done ?? 0}
              total={stats?.totalTasks ?? 1}
              color="bg-green-500"
            />
            <ProgressItem
              label="In Progress"
              value={stats?.inProgress ?? 0}
              total={stats?.totalTasks ?? 1}
              color="bg-blue-500"
            />
            <ProgressItem
              label="Todo"
              value={stats?.todo ?? 0}
              total={stats?.totalTasks ?? 1}
              color="bg-slate-500"
            />
            <ProgressItem
              label="Overdue"
              value={stats?.overdue ?? 0}
              total={stats?.totalTasks ?? 1}
              color="bg-red-500"
            />
          </div>

          {/* Donut style summary */}
          <div className="mt-6 pt-6 border-t border-white/5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Completion Rate</span>
              <span className="text-white font-semibold">
                {stats?.totalTasks
                  ? Math.round((stats.done / stats.totalTasks) * 100)
                  : 0}%
              </span>
            </div>
            <div className="mt-2 h-2 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-green-500 rounded-full transition-all duration-700"
                style={{
                  width: `${stats?.totalTasks ? Math.round((stats.done / stats.totalTasks) * 100) : 0}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Recent Tasks */}
        <div className="xl:col-span-2 bg-[#1a1a2e]/60 border border-white/5 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-white font-semibold">Recent Tasks</h3>
            <span className="text-indigo-400 text-sm hover:text-indigo-300 cursor-pointer">View all</span>
          </div>

          {recentTasks.length === 0 ? (
            <EmptyState message="No tasks yet. Create a project and add tasks!" />
          ) : (
            <div className="space-y-3">
              {recentTasks.map((task) => (
                <TaskRow key={task._id} task={task} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────

function ProgressItem({ label, value, total, color }) {
  const pct = total ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-sm mb-1.5">
        <span className="text-slate-400">{label}</span>
        <span className="text-white font-medium">
          {value} <span className="text-slate-500">({pct}%)</span>
        </span>
      </div>
      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all duration-700`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function TaskRow({ task }) {
  const isOverdue =
    task.status !== "done" &&
    task.dueDate &&
    new Date(task.dueDate) < new Date();

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/3 hover:bg-white/5 border border-white/5 hover:border-indigo-500/20 transition-all duration-200 group">
      {/* Status dot */}
      <div
        className={`w-2 h-2 rounded-full flex-shrink-0 ${
          task.status === "done"
            ? "bg-green-500"
            : task.status === "in_progress"
            ? "bg-blue-500"
            : isOverdue
            ? "bg-red-500"
            : "bg-slate-500"
        }`}
      />

      {/* Task info */}
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-medium truncate ${
            task.status === "done" ? "text-slate-400 line-through" : "text-white"
          }`}
        >
          {task.title}
        </p>
        <p className="text-xs text-slate-500 truncate mt-0.5">
          {task.project?.name || "No project"}
        </p>
      </div>

      {/* Badge */}
      <div className="flex-shrink-0">
        <Badge
          label={isOverdue ? "Overdue" : task.status.replace("_", " ")}
          type={isOverdue ? "overdue" : task.status}
        />
      </div>

      {/* Due date */}
      {task.dueDate && (
        <span className="hidden sm:block text-xs text-slate-500 flex-shrink-0">
          {format(new Date(task.dueDate), "MMM d")}
        </span>
      )}
    </div>
  );
}

function EmptyState({ message }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-14 h-14 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center mb-4">
        <CheckSquare className="w-6 h-6 text-indigo-400" />
      </div>
      <p className="text-slate-400 text-sm">{message}</p>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="h-8 w-64 bg-white/5 rounded-xl" />
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 bg-white/5 rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="h-64 bg-white/5 rounded-2xl" />
        <div className="xl:col-span-2 h-64 bg-white/5 rounded-2xl" />
      </div>
    </div>
  );
}

// Helper
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Morning";
  if (h < 17) return "Afternoon";
  return "Evening";
}
