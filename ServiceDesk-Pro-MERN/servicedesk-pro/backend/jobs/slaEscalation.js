const cron = require("node-cron");
const Ticket = require("../models/Ticket");
const User = require("../models/User");
const Notification = require("../models/Notification");

/**
 * Runs every 5 minutes. Checks all open tickets:
 *  - marks response/resolution SLA as breached if past due
 *  - escalates breached tickets (increments escalationLevel, sets status Escalated,
 *    notifies IT Managers / Admins)
 */
async function runSlaCheck() {
  const now = new Date();
  const activeStatuses = ["Open", "In Progress", "On Hold", "Escalated", "Reopened"];

  const tickets = await Ticket.find({ status: { $in: activeStatuses } });

  const managers = await User.find({ role: { $in: ["it_manager", "admin"] } });

  for (const ticket of tickets) {
    let changed = false;

    if (
      ticket.responseDueAt &&
      !ticket.firstRespondedAt &&
      now > ticket.responseDueAt &&
      !ticket.isResponseBreached
    ) {
      ticket.isResponseBreached = true;
      changed = true;
    }

    if (
      ticket.resolutionDueAt &&
      !ticket.resolvedAt &&
      now > ticket.resolutionDueAt &&
      !ticket.isResolutionBreached
    ) {
      ticket.isResolutionBreached = true;
      ticket.status = "Escalated";
      ticket.escalationLevel = (ticket.escalationLevel || 0) + 1;
      ticket.history.push({
        action: "Auto-Escalated",
        note: "SLA resolution time breached — automatically escalated.",
        date: now,
      });
      changed = true;

      for (const mgr of managers) {
        await Notification.create({
          user: mgr._id,
          message: `Ticket ${ticket.ticketNumber} breached its SLA and was escalated.`,
          type: "sla_breach",
          link: `/tickets/${ticket._id}`,
        });
      }
    }

    if (changed) await ticket.save();
  }
}

function startSlaCron() {
  // every 5 minutes
  cron.schedule("*/5 * * * *", () => {
    runSlaCheck().catch((err) => console.error("SLA cron error:", err.message));
  });
  console.log("SLA escalation cron scheduled (every 5 minutes).");
}

module.exports = { startSlaCron, runSlaCheck };
