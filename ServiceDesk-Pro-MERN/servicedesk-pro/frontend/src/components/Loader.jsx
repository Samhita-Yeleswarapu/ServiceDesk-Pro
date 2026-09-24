export default function Loader({ full }) {
  return (
    <div className={full ? "min-h-screen flex items-center justify-center bg-slate-50" : "flex items-center justify-center py-16"}>
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
        <p className="text-sm text-slate-400 font-medium">Loading...</p>
      </div>
    </div>
  );
}
