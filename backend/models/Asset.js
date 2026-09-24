const mongoose = require("mongoose");

const assetSchema = new mongoose.Schema(
  {
    assetTag: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ["Laptop", "Desktop", "Monitor", "Server", "Printer", "Networking", "Software License", "Mobile", "Other"],
      required: true,
    },
    serialNumber: { type: String, default: "" },
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: "Vendor" },
    purchaseDate: { type: Date },
    warrantyExpiry: { type: Date },
    cost: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["In Stock", "Assigned", "Under Repair", "Retired", "Lost"],
      default: "In Stock",
    },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    department: { type: mongoose.Schema.Types.ObjectId, ref: "Department" },
    location: { type: String, default: "" },
    notes: { type: String, default: "" },
    lifecycleLog: [
      {
        action: { type: String },
        by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        note: { type: String },
        date: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

assetSchema.index({ name: "text", assetTag: "text", serialNumber: "text" });

module.exports = mongoose.model("Asset", assetSchema);
