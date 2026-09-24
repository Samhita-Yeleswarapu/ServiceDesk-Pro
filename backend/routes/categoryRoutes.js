const express = require("express");
const router = express.Router();
const {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} = require("../controllers/categoryController");
const { protect, authorize } = require("../middleware/auth");

router.use(protect);
router.route("/").get(getCategories).post(authorize("admin", "it_manager"), createCategory);
router
  .route("/:id")
  .put(authorize("admin", "it_manager"), updateCategory)
  .delete(authorize("admin", "it_manager"), deleteCategory);

module.exports = router;
