const asyncHandler = require("express-async-handler");
const KnowledgeArticle = require("../models/KnowledgeArticle");

const getArticles = asyncHandler(async (req, res) => {
  const { search, category, tag } = req.query;
  const filter = { isPublished: true };
  if (category) filter.category = category;
  if (tag) filter.tags = tag.toLowerCase();

  let query;
  if (search) {
    query = KnowledgeArticle.find(
      { ...filter, $text: { $search: search } },
      { score: { $meta: "textScore" } }
    ).sort({ score: { $meta: "textScore" } });
  } else {
    query = KnowledgeArticle.find(filter).sort({ createdAt: -1 });
  }

  const articles = await query.populate("category", "name color").populate("author", "name");
  res.json({ success: true, count: articles.length, data: articles });
});

const getArticle = asyncHandler(async (req, res) => {
  const article = await KnowledgeArticle.findById(req.params.id)
    .populate("category", "name color")
    .populate("author", "name");
  if (!article) {
    res.status(404);
    throw new Error("Article not found");
  }
  article.views += 1;
  await article.save();
  res.json({ success: true, data: article });
});

const createArticle = asyncHandler(async (req, res) => {
  const article = await KnowledgeArticle.create({ ...req.body, author: req.user._id });
  res.status(201).json({ success: true, data: article });
});

const updateArticle = asyncHandler(async (req, res) => {
  const article = await KnowledgeArticle.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!article) {
    res.status(404);
    throw new Error("Article not found");
  }
  res.json({ success: true, data: article });
});

const deleteArticle = asyncHandler(async (req, res) => {
  const article = await KnowledgeArticle.findById(req.params.id);
  if (!article) {
    res.status(404);
    throw new Error("Article not found");
  }
  article.isPublished = false;
  await article.save();
  res.json({ success: true, message: "Article unpublished" });
});

const markHelpful = asyncHandler(async (req, res) => {
  const article = await KnowledgeArticle.findById(req.params.id);
  if (!article) {
    res.status(404);
    throw new Error("Article not found");
  }
  article.helpfulCount += 1;
  await article.save();
  res.json({ success: true, data: article });
});

module.exports = { getArticles, getArticle, createArticle, updateArticle, deleteArticle, markHelpful };
