const mongoose = require("mongoose");

const workLogSchema = new mongoose.Schema(
  {
    ticket: { type: mongoose.Schema.Types.ObjectId, ref: "Ticket", required: true },
    technician: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    description: { type: String, required: true },
    hoursSpent: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("WorkLog", workLogSchema);
