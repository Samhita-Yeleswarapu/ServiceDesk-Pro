const STATUS_STYLES = {
  Open: "bg-brand-100 text-brand-700",
  "In Progress": "bg-amber-100 text-amber-700",
  "On Hold": "bg-slate-200 text-slate-600",
  Escalated: "bg-rose-100 text-rose-700",
  Resolved: "bg-emerald-100 text-emerald-700",
  Closed: "bg-slate-100 text-slate-500",
  Reopened: "bg-teal-100 text-teal-700",
};

const PRIORITY_STYLES = {
  Low: "bg-slate-100 text-slate-600",
  Medium: "bg-brand-100 text-brand-700",
  High: "bg-orange-100 text-orange-700",
  Critical: "bg-rose-100 text-rose-700",
};

const ASSET_STYLES = {
  "In Stock": "bg-brand-100 text-brand-700",
  Assigned: "bg-emerald-100 text-emerald-700",
  "Under Repair": "bg-amber-100 text-amber-700",
  Retired: "bg-slate-100 text-slate-500",
  Lost: "bg-rose-100 text-rose-700",
};

export function StatusBadge({ status }) {
  return <span className={`badge ${STATUS_STYLES[status] || "bg-slate-100 text-slate-600"}`}>{status}</span>;
}

export function PriorityBadge({ priority }) {
  return <span className={`badge ${PRIORITY_STYLES[priority] || "bg-slate-100 text-slate-600"}`}>{priority}</span>;
}

export function AssetStatusBadge({ status }) {
  return <span className={`badge ${ASSET_STYLES[status] || "bg-slate-100 text-slate-600"}`}>{status}</span>;
}
