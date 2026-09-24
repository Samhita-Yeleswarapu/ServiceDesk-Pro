const mongoose = require("mongoose");

const knowledgeArticleSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    summary: { type: String, default: "" },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    tags: [{ type: String, trim: true, lowercase: true }],
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    views: { type: Number, default: 0 },
    helpfulCount: { type: Number, default: 0 },
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true }
);

knowledgeArticleSchema.index({ title: "text", content: "text", tags: "text", summary: "text" });

module.exports = mongoose.model("KnowledgeArticle", knowledgeArticleSchema);
