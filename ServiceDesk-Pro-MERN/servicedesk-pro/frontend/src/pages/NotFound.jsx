import { Link } from "react-router-dom";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="text-center">
        <div className="w-20 h-20 rounded-2xl bg-brand-50 flex items-center justify-center text-brand-400 mx-auto mb-5">
          <Compass size={36} />
        </div>
        <h1 className="text-3xl font-bold text-slate-800 font-display">404</h1>
        <p className="text-slate-500 mt-2">The page you're looking for doesn't exist.</p>
        <Link to="/dashboard" className="btn-primary mt-6 inline-flex">Back to Dashboard</Link>
      </div>
    </div>
  );
}
