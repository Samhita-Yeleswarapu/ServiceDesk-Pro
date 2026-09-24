const express = require("express");
const router = express.Router();
const {
  getAssets,
  getAsset,
  createAsset,
  updateAsset,
  deleteAsset,
} = require("../controllers/assetController");
const { protect, authorize } = require("../middleware/auth");

router.use(protect);
const canManage = authorize("admin", "asset_manager");

router.route("/").get(getAssets).post(canManage, createAsset);
router.route("/:id").get(getAsset).put(canManage, updateAsset).delete(canManage, deleteAsset);

module.exports = router;
