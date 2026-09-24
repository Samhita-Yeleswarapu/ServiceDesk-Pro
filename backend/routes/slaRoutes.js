const express = require("express");
const router = express.Router();
const { getSLAs, createSLA, updateSLA, deleteSLA } = require("../controllers/slaController");
const { protect, authorize } = require("../middleware/auth");

router.use(protect);
router.route("/").get(getSLAs).post(authorize("admin"), createSLA);
router.route("/:id").put(authorize("admin"), updateSLA).delete(authorize("admin"), deleteSLA);

module.exports = router;
