import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import * as api from "../../api/endpoints";
import Loader from "../../components/Loader";
import toast from "react-hot-toast";
import { ArrowLeft, Eye, ThumbsUp, Tag } from "lucide-react";
import { format } from "date-fns";

export default function KBDetail() {
  const { id } = useParams();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [marked, setMarked] = useState(false);

  useEffect(() => {
    api.getArticle(id)
      .then((res) => setArticle(res.data.data))
      .catch(() => toast.error("Article not found"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleHelpful = async () => {
    if (marked) return;
    try {
      const res = await api.markHelpful(id);
      setArticle(res.data.data);
      setMarked(true);
      toast.success("Thanks for your feedback!");
    } catch (e) {
      toast.error("Failed to submit feedback");
    }
  };

  if (loading) return <Loader />;
  if (!article) return null;

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <Link to="/knowledge-base" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-brand-600 font-medium">
        <ArrowLeft size={15} /> Back to Knowledge Base
      </Link>

      <div className="card">
        {article.category && (
          <span className="badge mb-3" style={{ backgroundColor: `${article.category.color}20`, color: article.category.color }}>
            {article.category.name}
          </span>
        )}
        <h1 className="text-2xl font-bold text-slate-800 font-display">{article.title}</h1>
        <p className="text-slate-500 mt-1.5">{article.summary}</p>

        <div className="flex items-center gap-4 mt-4 pb-4 border-b border-slate-100 text-xs text-slate-400">
          <span>By {article.author?.name}</span>
          <span>{format(new Date(article.createdAt), "MMM d, yyyy")}</span>
          <span className="flex items-center gap-1"><Eye size={13} /> {article.views} views</span>
        </div>

        <div className="prose prose-sm max-w-none mt-5 text-slate-700 whitespace-pre-wrap leading-relaxed">
          {article.content}
        </div>

        {article.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-6">
            {article.tags.map((t) => (
              <span key={t} className="badge bg-slate-100 text-slate-500 text-xs"><Tag size={10} className="mr-1" />{t}</span>
            ))}
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
          <p className="text-sm text-slate-500">Was this article helpful?</p>
          <button onClick={handleHelpful} disabled={marked} className="btn-secondary !py-1.5">
            <ThumbsUp size={14} /> {marked ? "Thanks!" : "Yes, helpful"} ({article.helpfulCount})
          </button>
        </div>
      </div>
    </div>
  );
}
