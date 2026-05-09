const variants = {
  todo: "bg-slate-500/20 text-slate-300 border-slate-500/30",
  in_progress: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  done: "bg-green-500/20 text-green-300 border-green-500/30",
  overdue: "bg-red-500/20 text-red-300 border-red-500/30",
  admin: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  member: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
  low: "bg-green-500/20 text-green-300 border-green-500/30",
  medium: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  high: "bg-red-500/20 text-red-300 border-red-500/30",
};

export default function Badge({ label, type }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${variants[type] || variants.todo}`}>
      {label}
    </span>
  );
}
