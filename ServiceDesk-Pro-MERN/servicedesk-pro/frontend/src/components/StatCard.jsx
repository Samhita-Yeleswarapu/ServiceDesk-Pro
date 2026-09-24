export default function StatCard({ label, value, icon: Icon, color = "brand", trend }) {
  const colorMap = {
    brand: "from-brand-700 to-brand-500",
    teal: "from-teal-600 to-teal-400",
    coral: "from-coral-500 to-coral-400",
    rose: "from-rose-700 to-rose-500",
    amber: "from-amber-500 to-amber-400",
    emerald: "from-emerald-700 to-emerald-500",
  };
  return (
    <div className="card hover:-translate-y-0.5 transition-transform duration-200">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-bold text-brand-900 mt-1.5 font-display">{value}</p>
          {trend && <p className="text-xs text-emerald-500 font-medium mt-1">{trend}</p>}
        </div>
        {Icon && (
          <div className={`w-11 h-11 rounded-lg bg-gradient-to-br ${colorMap[color]} flex items-center justify-center text-white shadow-soft`}>
            <Icon size={20} />
          </div>
        )}
      </div>
    </div>
  );
}
