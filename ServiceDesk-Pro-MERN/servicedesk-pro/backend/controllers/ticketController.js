const asyncHandler = require("express-async-handler");
const Ticket = require("../models/Ticket");
const Comment = require("../models/Comment");
const WorkLog = require("../models/WorkLog");
const User = require("../models/User");
const SLA = require("../models/SLA");
const Notification = require("../models/Notification");
const AuditLog = require("../models/AuditLog");
const { classifyTicket, suggestArticles } = require("../utils/aiService");

const STAFF_ROLES = ["admin", "it_manager", "technician", "asset_manager"];

// helper to add hours to a date
function addHours(date, hours) {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

// @desc Create ticket (with AI classification)
// @route POST /api/tickets
const createTicket = asyncHandler(async (req, res) => {
  const { subject, description, category, priority, department, attachments } = req.body;

  // Run AI classification
  const aiResult = await classifyTicket(subject, description);
  const suggestedArticles = await suggestArticles(subject, description, 5);

  const finalPriority = priority || aiResult.suggestedPriority || "Medium";
  const finalCategory = category || aiResult.suggestedCategoryId || undefined;

  // find matching SLA policy for priority
  const sla = await SLA.findOne({ priority: finalPriority, isActive: true });

  const now = new Date();
  const ticketData = {
    subject,
    description,
    category: finalCategory,
    priority: finalPriority,
    department: department || req.user.department,
    requester: req.user._id,
    attachments: attachments || [],
    aiSuggestedCategory: aiResult.suggestedCategoryName,
    aiSuggestedPriority: aiResult.suggestedPriority,
    aiProbableIssue: aiResult.probableIssue,
    aiSuggestedArticles: suggestedArticles.map((a) => a._id),
    aiConfidence: aiResult.confidence,
    aiSuggestedResolution: aiResult.suggestedResolution || "",
    aiSource: aiResult.source || "local",
    sla: sla ? sla._id : undefined,
    history: [{ action: "Created", by: req.user._id, note: "Ticket created", date: now }],
  };

  if (sla) {
    ticketData.responseDueAt = addHours(now, sla.responseTimeHours);
    ticketData.resolutionDueAt = addHours(now, sla.resolutionTimeHours);
  }

  const ticket = await Ticket.create(ticketData);

  // Notify IT managers of new ticket
  const managers = await User.find({ role: { $in: ["it_manager", "admin"] } });
  for (const mgr of managers) {
    await Notification.create({
      user: mgr._id,
      message: `New ticket ${ticket.ticketNumber}: ${subject}`,
      type: "general",
      link: `/tickets/${ticket._id}`,
    });
  }

  await AuditLog.create({
    user: req.user._id,
    action: "CREATE_TICKET",
    entityType: "Ticket",
    entityId: ticket._id,
    details: `Created ticket ${ticket.ticketNumber}`,
  });

  const populated = await Ticket.findById(ticket._id)
    .populate("requester", "name email")
    .populate("category", "name color")
    .populate("sla")
    .populate("aiSuggestedArticles", "title summary");

  res.status(201).json({ success: true, data: populated });
});

// @desc Get tickets (filtered by role)
// @route GET /api/tickets
const getTickets = asyncHandler(async (req, res) => {
  const { status, priority, category, assignedTo, search, department, mine } = req.query;
  const filter = {};

  // Role-based visibility: employees only see their own tickets
  if (req.user.role === "employee") {
    filter.requester = req.user._id;
  } else if (req.user.role === "technician" && mine === "true") {
    filter.assignedTo = req.user._id;
  }

  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (category) filter.category = category;
  if (assignedTo) filter.assignedTo = assignedTo;
  if (department) filter.department = department;
  if (search) {
    filter.$or = [
      { subject: { $regex: search, $options: "i" } },
      { ticketNumber: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }

  const tickets = await Ticket.find(filter)
    .populate("requester", "name email")
    .populate("assignedTo", "name email")
    .populate("category", "name color")
    .populate("department", "name")
    .populate("sla", "name priority")
    .sort({ createdAt: -1 });

  res.json({ success: true, count: tickets.length, data: tickets });
});

// @desc Get single ticket with comments + worklogs
// @route GET /api/tickets/:id
const getTicket = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findById(req.params.id)
    .populate("requester", "name email role")
    .populate("assignedTo", "name email role")
    .populate("category", "name color")
    .populate("department", "name")
    .populate("sla")
    .populate("aiSuggestedArticles", "title summary category")
    .populate("history.by", "name role");

  if (!ticket) {
    res.status(404);
    throw new Error("Ticket not found");
  }

  // employees can only view their own ticket
  if (
    req.user.role === "employee" &&
    ticket.requester._id.toString() !== req.user._id.toString()
  ) {
    res.status(403);
    throw new Error("Not authorized to view this ticket");
  }

  const isStaff = STAFF_ROLES.includes(req.user.role);
  const commentFilter = { ticket: ticket._id };
  if (!isStaff) commentFilter.isInternal = false;

  const comments = await Comment.find(commentFilter)
    .populate("author", "name role avatarColor")
    .sort({ createdAt: 1 });

  const workLogs = isStaff
    ? await WorkLog.find({ ticket: ticket._id }).populate("technician", "name").sort({ createdAt: -1 })
    : [];

  res.json({ success: true, data: { ticket, comments, workLogs } });
});

// @desc Update ticket (assignment, priority, status changes, lifecycle)
// @route PUT /api/tickets/:id
const updateTicket = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findById(req.params.id);
  if (!ticket) {
    res.status(404);
    throw new Error("Ticket not found");
  }

  const { status, priority, assignedTo, category, note } = req.body;
  const now = new Date();

  if (assignedTo !== undefined && assignedTo !== String(ticket.assignedTo || "")) {
    ticket.assignedTo = assignedTo || null;
    const tech = assignedTo ? await User.findById(assignedTo) : null;
    ticket.history.push({
      action: "Assigned",
      by: req.user._id,
      note: tech ? `Assigned to ${tech.name}` : "Unassigned",
      date: now,
    });
    if (tech) {
      await Notification.create({
        user: tech._id,
        message: `Ticket ${ticket.ticketNumber} was assigned to you`,
        type: "ticket_assigned",
        link: `/tickets/${ticket._id}`,
      });
    }
  }

  if (priority && priority !== ticket.priority) {
    ticket.priority = priority;
    const sla = await SLA.findOne({ priority, isActive: true });
    if (sla) {
      ticket.sla = sla._id;
      ticket.resolutionDueAt = addHours(now, sla.resolutionTimeHours);
      if (!ticket.firstRespondedAt) ticket.responseDueAt = addHours(now, sla.responseTimeHours);
    }
    ticket.history.push({ action: "Priority Changed", by: req.user._id, note: `Priority set to ${priority}`, date: now });
  }

  if (category) {
    ticket.category = category;
  }

  if (status && status !== ticket.status) {
    if (!ticket.firstRespondedAt && ["In Progress", "On Hold"].includes(status)) {
      ticket.firstRespondedAt = now;
    }
    if (status === "Resolved") {
      ticket.resolvedAt = now;
    }
    if (status === "Closed") {
      ticket.closedAt = now;
      if (!ticket.resolvedAt) ticket.resolvedAt = now;
    }
    if (status === "Reopened") {
      ticket.reopenCount += 1;
      ticket.resolvedAt = undefined;
      ticket.closedAt = undefined;
      const sla = await SLA.findOne({ priority: ticket.priority, isActive: true });
      if (sla) ticket.resolutionDueAt = addHours(now, sla.resolutionTimeHours);
    }
    ticket.status = status;
    ticket.history.push({ action: "Status Changed", by: req.user._id, note: `Status set to ${status}${note ? ` — ${note}` : ""}`, date: now });

    // Notify requester of status change
    await Notification.create({
      user: ticket.requester,
      message: `Your ticket ${ticket.ticketNumber} status changed to "${status}"`,
      type: "ticket_updated",
      link: `/tickets/${ticket._id}`,
    });
  }

  await ticket.save();

  await AuditLog.create({
    user: req.user._id,
    action: "UPDATE_TICKET",
    entityType: "Ticket",
    entityId: ticket._id,
    details: `Updated ticket ${ticket.ticketNumber}`,
  });

  const populated = await Ticket.findById(ticket._id)
    .populate("requester", "name email")
    .populate("assignedTo", "name email")
    .populate("category", "name color")
    .populate("sla");

  res.json({ success: true, data: populated });
});

// @desc Add comment / internal note to ticket
// @route POST /api/tickets/:id/comments
const addComment = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findById(req.params.id);
  if (!ticket) {
    res.status(404);
    throw new Error("Ticket not found");
  }

  const isStaff = STAFF_ROLES.includes(req.user.role);
  const { message, isInternal, attachments } = req.body;

  const comment = await Comment.create({
    ticket: ticket._id,
    author: req.user._id,
    message,
    isInternal: isStaff ? !!isInternal : false,
    attachments: attachments || [],
  });

  if (!ticket.firstRespondedAt && isStaff) {
    ticket.firstRespondedAt = new Date();
  }
  ticket.history.push({
    action: "Comment Added",
    by: req.user._id,
    note: isInternal ? "Internal note added" : "Comment added",
  });
  await ticket.save();

  // notify the other party
  const notifyUserId =
    req.user._id.toString() === ticket.requester.toString() ? ticket.assignedTo : ticket.requester;
  if (notifyUserId && !isInternal) {
    await Notification.create({
      user: notifyUserId,
      message: `New comment on ticket ${ticket.ticketNumber}`,
      type: "comment",
      link: `/tickets/${ticket._id}`,
    });
  }

  const populated = await comment.populate("author", "name role avatarColor");
  res.status(201).json({ success: true, data: populated });
});

// @desc Add work log entry (technician)
// @route POST /api/tickets/:id/worklogs
const addWorkLog = asyncHandler(async (req, res) => {
  const { description, hoursSpent } = req.body;
  const ticket = await Ticket.findById(req.params.id);
  if (!ticket) {
    res.status(404);
    throw new Error("Ticket not found");
  }

  const workLog = await WorkLog.create({
    ticket: ticket._id,
    technician: req.user._id,
    description,
    hoursSpent,
  });

  ticket.history.push({ action: "Work Log Added", by: req.user._id, note: description });
  await ticket.save();

  const populated = await workLog.populate("technician", "name");
  res.status(201).json({ success: true, data: populated });
});

// @desc Get AI suggestions for a ticket (re-run classification)
// @route GET /api/tickets/:id/ai-suggestions
const getAISuggestions = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findById(req.params.id);
  if (!ticket) {
    res.status(404);
    throw new Error("Ticket not found");
  }
  const aiResult = await classifyTicket(ticket.subject, ticket.description);
  const articles = await suggestArticles(ticket.subject, ticket.description, 5);

  res.json({ success: true, data: { ...aiResult, articles } });
});

module.exports = {
  createTicket,
  getTickets,
  getTicket,
  updateTicket,
  addComment,
  addWorkLog,
  getAISuggestions,
};
