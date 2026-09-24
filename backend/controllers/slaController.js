const asyncHandler = require("express-async-handler");
const SLA = require("../models/SLA");

const getSLAs = asyncHandler(async (req, res) => {
  const slas = await SLA.find().sort({ priority: 1 });
  res.json({ success: true, data: slas });
});

const createSLA = asyncHandler(async (req, res) => {
  const sla = await SLA.create(req.body);
  res.status(201).json({ success: true, data: sla });
});

const updateSLA = asyncHandler(async (req, res) => {
  const sla = await SLA.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!sla) {
    res.status(404);
    throw new Error("SLA policy not found");
  }
  res.json({ success: true, data: sla });
});

const deleteSLA = asyncHandler(async (req, res) => {
  const sla = await SLA.findById(req.params.id);
  if (!sla) {
    res.status(404);
    throw new Error("SLA policy not found");
  }
  sla.isActive = false;
  await sla.save();
  res.json({ success: true, message: "SLA policy deactivated" });
});

module.exports = { getSLAs, createSLA, updateSLA, deleteSLA };
