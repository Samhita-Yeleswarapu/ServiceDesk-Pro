const express = require("express");
const router = express.Router();
const {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  getTechnicianWorkload,
} = require("../controllers/userController");
const { protect, authorize } = require("../middleware/auth");

router.use(protect);

router.get("/technicians/workload", authorize("admin", "it_manager"), getTechnicianWorkload);

router
  .route("/")
  .get(authorize("admin", "it_manager"), getUsers)
  .post(authorize("admin"), createUser);

router
  .route("/:id")
  .get(authorize("admin", "it_manager"), getUser)
  .put(authorize("admin"), updateUser)
  .delete(authorize("admin"), deleteUser);

module.exports = router;
