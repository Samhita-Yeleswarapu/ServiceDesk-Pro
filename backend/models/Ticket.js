const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema(
  {
    ticketNumber: { type: String, unique: true },
    subject: { type: String, required: [true, "Subject is required"], trim: true },
    description: { type: String, required: [true, "Description is required"] },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Critical"],
      default: "Medium",
    },
    status: {
      type: String,
      enum: ["Open", "In Progress", "On Hold", "Escalated", "Resolved", "Closed", "Reopened"],
      default: "Open",
    },
    requester: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    department: { type: mongoose.Schema.Types.ObjectId, ref: "Department" },
    sla: { type: mongoose.Schema.Types.ObjectId, ref: "SLA" },

    // AI-derived fields
    aiSuggestedCategory: { type: String, default: "" },
    aiSuggestedPriority: { type: String, default: "" },
    aiProbableIssue: { type: String, default: "" },
    aiSuggestedArticles: [{ type: mongoose.Schema.Types.ObjectId, ref: "KnowledgeArticle" }],
    aiConfidence: { type: Number, default: 0 },
    aiSuggestedResolution: { type: String, default: "" },
    aiSource: { type: String, default: "" },

    // SLA timers
    responseDueAt: { type: Date },
    resolutionDueAt: { type: Date },
    firstRespondedAt: { type: Date },
    resolvedAt: { type: Date },
    closedAt: { type: Date },
    isResponseBreached: { type: Boolean, default: false },
    isResolutionBreached: { type: Boolean, default: false },
    escalationLevel: { type: Number, default: 0 },

    attachments: [
      {
        fileName: String,
        fileUrl: String,
      },
    ],

    reopenCount: { type: Number, default: 0 },
    satisfactionRating: { type: Number, min: 1, max: 5 },

    history: [
      {
        action: String,
        by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        note: String,
        date: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

ticketSchema.index({ subject: "text", description: "text", ticketNumber: "text" });

ticketSchema.pre("save", async function (next) {
  if (!this.ticketNumber) {
    const count = await mongoose.model("Ticket").countDocuments();
    this.ticketNumber = `TKT-${String(count + 1).padStart(5, "0")}`;
  }
  next();
});

module.exports = mongoose.model("Ticket", ticketSchema);
