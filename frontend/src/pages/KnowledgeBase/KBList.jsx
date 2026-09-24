import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import * as api from "../../api/endpoints";
import { useAuth } from "../../context/AuthContext";
import Loader from "../../components/Loader";
import Modal from "../../components/Modal";
import EmptyState from "../../components/EmptyState";
import toast from "react-hot-toast";
import { Plus, Search, BookOpen, Eye, ThumbsUp } from "lucide-react";

export default function KBList() {
  const { user } = useAuth();
  const canManage = ["admin", "it_manager", "technician"].includes(user?.role);

  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: "", summary: "", content: "", category: "", tags: "" });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (categoryFilter) params.category = categoryFilter;
      const res = await api.getArticles(params);
      setArticles(res.data.data);
    } catch (e) {
      toast.error("Failed to load articles");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    api.getCategories().then((res) => setCategories(res.data.data)).catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, categoryFilter]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean) };
      await api.createArticle(payload);
      toast.success("Article published");
      setShowModal(false);
      setForm({ title: "", summary: "", content: "", category: "", tags: "" });
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to publish article");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="page-title">Knowledge Base</h2>
          <p className="page-sub">Self-service articles and solutions, AI-matched to tickets automatically.</p>
        </div>
        {canManage && <button onClick={() => setShowModal(true)} className="btn-primary"><Plus size={16} /> New Article</button>}
      </div>

      <div className="card flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="input pl-10" placeholder="Search articles..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="input md:w-56" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          <option value="">All Categories</option>
          {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
      </div>

      {loading ? (
        <Loader />
      ) : articles.length === 0 ? (
        <div className="card"><EmptyState icon={BookOpen} title="No articles found" message="Try a different search or add the first knowledge base article." /></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {articles.map((a) => (
            <Link key={a._id} to={`/knowledge-base/${a._id}`} className="card hover:-translate-y-0.5 transition-transform block">
              {a.category && (
                <span className="badge mb-2" style={{ backgroundColor: `${a.category.color}20`, color: a.category.color }}>
                  {a.category.name}
                </span>
              )}
              <h3 className="font-bold text-slate-800 leading-snug">{a.title}</h3>
              <p className="text-sm text-slate-500 mt-1.5 line-clamp-2">{a.summary}</p>
              <div className="flex items-center gap-4 mt-4 text-xs text-slate-400">
                <span className="flex items-center gap-1"><Eye size={13} /> {a.views}</span>
                <span className="flex items-center gap-1"><ThumbsUp size={13} /> {a.helpfulCount}</span>
                <span className="ml-auto">{a.author?.name}</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Publish Knowledge Base Article" size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Title</label>
            <input required className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div>
            <label className="label">Summary</label>
            <input required className="input" value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} />
          </div>
          <div>
            <label className="label">Content (step-by-step solution)</label>
            <textarea required rows={6} className="input" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Category</label>
              <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                <option value="">None</option>
                {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Tags (comma-separated)</label>
              <input className="input" placeholder="password, login, reset" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? "Publishing..." : "Publish"}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
