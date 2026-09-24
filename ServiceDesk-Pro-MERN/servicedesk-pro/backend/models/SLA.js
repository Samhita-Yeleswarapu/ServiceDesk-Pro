const mongoose = require("mongoose");

// SLA policy defines response/resolution time (in hours) per priority
const slaSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Critical"],
      required: true,
    },
    responseTimeHours: { type: Number, required: true }, // time to first response
    resolutionTimeHours: { type: Number, required: true }, // time to resolve
    escalateTo: {
      type: String,
      enum: ["it_manager", "admin"],
      default: "it_manager",
    },
    businessHoursOnly: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SLA", slaSchema);
