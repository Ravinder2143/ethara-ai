export default function StatCard({ title, value, icon: Icon, color, sub }) {
  const colors = {
    indigo: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    green: "bg-green-500/10 text-green-400 border-green-500/20",
    yellow: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    red: "bg-red-500/10 text-red-400 border-red-500/20",
    blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  };

  return (
    <div className="bg-[#1a1a2e]/60 border border-white/5 rounded-2xl p-5 hover:border-indigo-500/20 transition-all duration-200">
      <div className="flex items-center justify-between mb-4">
        <p className="text-slate-400 text-sm font-medium">{title}</p>
        <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${colors[color] || colors.indigo}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <p className="text-3xl font-bold text-white mb-1">{value}</p>
      {sub && <p className="text-slate-500 text-xs">{sub}</p>}
    </div>
  );
}
