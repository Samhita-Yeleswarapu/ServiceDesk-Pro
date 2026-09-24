const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const AuditLog = require("../models/AuditLog");

// @desc Get all users (admin / it_manager)
// @route GET /api/users
const getUsers = asyncHandler(async (req, res) => {
  const { role, department, search, isActive } = req.query;
  const filter = {};
  if (role) filter.role = role;
  if (department) filter.department = department;
  if (isActive !== undefined) filter.isActive = isActive === "true";
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }

  const users = await User.find(filter)
    .populate("department", "name")
    .sort({ createdAt: -1 });
  res.json({ success: true, count: users.length, data: users });
});

// @desc Get single user
// @route GET /api/users/:id
const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).populate("department", "name");
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }
  res.json({ success: true, data: user });
});

// @desc Admin creates a user with any role
// @route POST /api/users
const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, department, phone } = req.body;

  const exists = await User.findOne({ email });
  if (exists) {
    res.status(400);
    throw new Error("A user with this email already exists");
  }

  const user = await User.create({ name, email, password, role, department, phone });

  await AuditLog.create({
    user: req.user._id,
    action: "CREATE_USER",
    entityType: "User",
    entityId: user._id,
    details: `Admin ${req.user.email} created user ${email} with role ${role}`,
  });

  res.status(201).json({ success: true, data: user });
});

// @desc Update user (admin)
// @route PUT /api/users/:id
const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  const fields = ["name", "role", "department", "phone", "isActive", "avatarColor"];
  fields.forEach((f) => {
    if (req.body[f] !== undefined) user[f] = req.body[f];
  });
  if (req.body.password) user.password = req.body.password;

  const updated = await user.save();

  await AuditLog.create({
    user: req.user._id,
    action: "UPDATE_USER",
    entityType: "User",
    entityId: user._id,
    details: `Admin ${req.user.email} updated user ${user.email}`,
  });

  res.json({ success: true, data: updated });
});

// @desc Delete (deactivate) user
// @route DELETE /api/users/:id
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }
  user.isActive = false;
  await user.save();

  await AuditLog.create({
    user: req.user._id,
    action: "DEACTIVATE_USER",
    entityType: "User",
    entityId: user._id,
    details: `Admin ${req.user.email} deactivated user ${user.email}`,
  });

  res.json({ success: true, message: "User deactivated" });
});

// @desc Get technicians with workload counts (for assignment)
// @route GET /api/users/technicians/workload
const getTechnicianWorkload = asyncHandler(async (req, res) => {
  const Ticket = require("../models/Ticket");
  const technicians = await User.find({ role: "technician", isActive: true }).populate(
    "department",
    "name"
  );

  const data = await Promise.all(
    technicians.map(async (tech) => {
      const activeCount = await Ticket.countDocuments({
        assignedTo: tech._id,
        status: { $in: ["Open", "In Progress", "On Hold", "Escalated", "Reopened"] },
      });
      return { ...tech.toObject(), activeTicketCount: activeCount };
    })
  );

  res.json({ success: true, data });
});

module.exports = {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  getTechnicianWorkload,
};
