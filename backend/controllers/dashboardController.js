const asyncHandler = require("express-async-handler");
const Ticket = require("../models/Ticket");
const Asset = require("../models/Asset");
const User = require("../models/User");

// @desc General dashboard stats, tailored by role
// @route GET /api/dashboard
const getDashboardStats = asyncHandler(async (req, res) => {
  const role = req.user.role;
  const baseFilter = role === "employee" ? { requester: req.user._id } : {};
  if (role === "technician") baseFilter.assignedTo = req.user._id;

  const [
    totalTickets,
    openTickets,
    inProgressTickets,
    resolvedTickets,
    escalatedTickets,
    breachedTickets,
    statusBreakdown,
    priorityBreakdown,
  ] = await Promise.all([
    Ticket.countDocuments(baseFilter),
    Ticket.countDocuments({ ...baseFilter, status: "Open" }),
    Ticket.countDocuments({ ...baseFilter, status: "In Progress" }),
    Ticket.countDocuments({ ...baseFilter, status: { $in: ["Resolved", "Closed"] } }),
    Ticket.countDocuments({ ...baseFilter, status: "Escalated" }),
    Ticket.countDocuments({ ...baseFilter, isResolutionBreached: true }),
    Ticket.aggregate([{ $match: baseFilter }, { $group: { _id: "$status", count: { $sum: 1 } } }]),
    Ticket.aggregate([{ $match: baseFilter }, { $group: { _id: "$priority", count: { $sum: 1 } } }]),
  ]);

  const stats = {
    totalTickets,
    openTickets,
    inProgressTickets,
    resolvedTickets,
    escalatedTickets,
    breachedTickets,
    statusBreakdown,
    priorityBreakdown,
  };

  // Manager / Admin extras
  if (["admin", "it_manager"].includes(role)) {
    const [totalAssets, assignedAssets, totalUsers, technicianCount, avgResolutionAgg] =
      await Promise.all([
        Asset.countDocuments(),
        Asset.countDocuments({ status: "Assigned" }),
        User.countDocuments({ isActive: true }),
        User.countDocuments({ role: "technician", isActive: true }),
        Ticket.aggregate([
          { $match: { resolvedAt: { $ne: null } } },
          {
            $project: {
              resolutionHours: {
                $divide: [{ $subtract: ["$resolvedAt", "$createdAt"] }, 1000 * 60 * 60],
              },
            },
          },
          { $group: { _id: null, avgHours: { $avg: "$resolutionHours" } } },
        ]),
      ]);

    stats.totalAssets = totalAssets;
    stats.assignedAssets = assignedAssets;
    stats.totalUsers = totalUsers;
    stats.technicianCount = technicianCount;
    stats.avgResolutionHours = avgResolutionAgg[0] ? Math.round(avgResolutionAgg[0].avgHours * 10) / 10 : 0;

    // SLA compliance %
    const totalClosed = await Ticket.countDocuments({ status: { $in: ["Resolved", "Closed"] } });
    const breachedClosed = await Ticket.countDocuments({
      status: { $in: ["Resolved", "Closed"] },
      isResolutionBreached: true,
    });
    stats.slaCompliance =
      totalClosed > 0 ? Math.round(((totalClosed - breachedClosed) / totalClosed) * 1000) / 10 : 100;

    // Technician workload
    const technicians = await User.find({ role: "technician", isActive: true });
    stats.technicianWorkload = await Promise.all(
      technicians.map(async (t) => ({
        name: t.name,
        id: t._id,
        activeTickets: await Ticket.countDocuments({
          assignedTo: t._id,
          status: { $in: ["Open", "In Progress", "On Hold", "Escalated", "Reopened"] },
        }),
      }))
    );
  }

  // Asset manager extras
  if (["admin", "asset_manager"].includes(role)) {
    const assetsByStatus = await Asset.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);
    const assetsByType = await Asset.aggregate([{ $group: { _id: "$type", count: { $sum: 1 } } }]);
    stats.assetsByStatus = assetsByStatus;
    stats.assetsByType = assetsByType;
  }

  res.json({ success: true, data: stats });
});

module.exports = { getDashboardStats };
