const express = require("express");
const router = express.Router();
const { getVendors, createVendor, updateVendor, deleteVendor } = require("../controllers/vendorController");
const { protect, authorize } = require("../middleware/auth");

router.use(protect);
router.route("/").get(getVendors).post(authorize("admin", "asset_manager"), createVendor);
router
  .route("/:id")
  .put(authorize("admin", "asset_manager"), updateVendor)
  .delete(authorize("admin", "asset_manager"), deleteVendor);

module.exports = router;
