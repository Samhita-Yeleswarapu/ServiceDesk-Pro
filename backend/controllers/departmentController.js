const asyncHandler = require("express-async-handler");
const Department = require("../models/Department");

const getDepartments = asyncHandler(async (req, res) => {
  const departments = await Department.find().sort({ name: 1 });
  res.json({ success: true, data: departments });
});

const createDepartment = asyncHandler(async (req, res) => {
  const department = await Department.create(req.body);
  res.status(201).json({ success: true, data: department });
});

const updateDepartment = asyncHandler(async (req, res) => {
  const department = await Department.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!department) {
    res.status(404);
    throw new Error("Department not found");
  }
  res.json({ success: true, data: department });
});

const deleteDepartment = asyncHandler(async (req, res) => {
  const department = await Department.findById(req.params.id);
  if (!department) {
    res.status(404);
    throw new Error("Department not found");
  }
  department.isActive = false;
  await department.save();
  res.json({ success: true, message: "Department deactivated" });
});

module.exports = { getDepartments, createDepartment, updateDepartment, deleteDepartment };
