const asyncHandler = require("express-async-handler");
const Vendor = require("../models/Vendor");

const getVendors = asyncHandler(async (req, res) => {
  const vendors = await Vendor.find().sort({ name: 1 });
  res.json({ success: true, data: vendors });
});

const createVendor = asyncHandler(async (req, res) => {
  const vendor = await Vendor.create(req.body);
  res.status(201).json({ success: true, data: vendor });
});

const updateVendor = asyncHandler(async (req, res) => {
  const vendor = await Vendor.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!vendor) {
    res.status(404);
    throw new Error("Vendor not found");
  }
  res.json({ success: true, data: vendor });
});

const deleteVendor = asyncHandler(async (req, res) => {
  const vendor = await Vendor.findById(req.params.id);
  if (!vendor) {
    res.status(404);
    throw new Error("Vendor not found");
  }
  vendor.isActive = false;
  await vendor.save();
  res.json({ success: true, message: "Vendor deactivated" });
});

module.exports = { getVendors, createVendor, updateVendor, deleteVendor };
