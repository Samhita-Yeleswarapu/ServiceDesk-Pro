const express = require("express");
const router = express.Router();
const {
  createTicket,
  getTickets,
  getTicket,
  updateTicket,
  addComment,
  addWorkLog,
  getAISuggestions,
} = require("../controllers/ticketController");
const { protect, authorize } = require("../middleware/auth");

router.use(protect);

router.route("/").get(getTickets).post(createTicket);
router.route("/:id").get(getTicket).put(updateTicket);
router.post("/:id/comments", addComment);
router.post(
  "/:id/worklogs",
  authorize("technician", "it_manager", "admin", "asset_manager"),
  addWorkLog
);
router.get("/:id/ai-suggestions", getAISuggestions);

module.exports = router;
