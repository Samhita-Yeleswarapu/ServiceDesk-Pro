const express = require("express");
const router = express.Router();
const {
  getArticles,
  getArticle,
  createArticle,
  updateArticle,
  deleteArticle,
  markHelpful,
} = require("../controllers/kbController");
const { protect, authorize } = require("../middleware/auth");

router.use(protect);
const canManage = authorize("admin", "it_manager", "technician");

router.route("/").get(getArticles).post(canManage, createArticle);
router.route("/:id").get(getArticle).put(canManage, updateArticle).delete(canManage, deleteArticle);
router.post("/:id/helpful", markHelpful);

module.exports = router;
