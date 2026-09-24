const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const generateToken = require("../utils/generateToken");
const AuditLog = require("../models/AuditLog");

// @desc Register new user (public registration = employee role only)
// @route POST /api/auth/register
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, department, phone } = req.body;

  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error("A user with this email already exists");
  }

  const user = await User.create({
    name,
    email,
    password,
    department: department || undefined,
    phone,
    role: "employee", // public signup always creates an Employee; admin can promote later
  });

  await AuditLog.create({
    user: user._id,
    action: "REGISTER",
    entityType: "User",
    entityId: user._id,
    details: `New account registered: ${email}`,
  });

  res.status(201).json({
    success: true,
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id, user.role),
    },
  });
});

// @desc Auth user & get token
// @route POST /api/auth/login
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select("+password").populate("department", "name");

  if (!user || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error("Invalid email or password");
  }

  if (!user.isActive) {
    res.status(403);
    throw new Error("Your account has been deactivated. Please contact your administrator.");
  }

  user.lastLogin = new Date();
  await user.save();

  res.json({
    success: true,
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      avatarColor: user.avatarColor,
      token: generateToken(user._id, user.role),
    },
  });
});

// @desc Get logged-in user's profile
// @route GET /api/auth/me
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate("department", "name");
  res.json({ success: true, data: user });
});

// @desc Update own profile
// @route PUT /api/auth/me
const updateMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  user.name = req.body.name || user.name;
  user.phone = req.body.phone ?? user.phone;
  user.avatarColor = req.body.avatarColor || user.avatarColor;
  if (req.body.password) user.password = req.body.password;

  const updated = await user.save();
  res.json({
    success: true,
    data: {
      _id: updated._id,
      name: updated.name,
      email: updated.email,
      role: updated.role,
      phone: updated.phone,
      avatarColor: updated.avatarColor,
    },
  });
});

module.exports = { registerUser, loginUser, getMe, updateMe };
