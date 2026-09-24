const asyncHandler = require("express-async-handler");
const Asset = require("../models/Asset");

const getAssets = asyncHandler(async (req, res) => {
  const { status, type, search, assignedTo } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (type) filter.type = type;
  if (assignedTo) filter.assignedTo = assignedTo;
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { assetTag: { $regex: search, $options: "i" } },
      { serialNumber: { $regex: search, $options: "i" } },
    ];
  }

  const assets = await Asset.find(filter)
    .populate("vendor", "name")
    .populate("assignedTo", "name email")
    .populate("department", "name")
    .sort({ createdAt: -1 });

  res.json({ success: true, count: assets.length, data: assets });
});

const getAsset = asyncHandler(async (req, res) => {
  const asset = await Asset.findById(req.params.id)
    .populate("vendor", "name contactPerson email")
    .populate("assignedTo", "name email")
    .populate("department", "name")
    .populate("lifecycleLog.by", "name");
  if (!asset) {
    res.status(404);
    throw new Error("Asset not found");
  }
  res.json({ success: true, data: asset });
});

const createAsset = asyncHandler(async (req, res) => {
  const asset = await Asset.create({
    ...req.body,
    lifecycleLog: [{ action: "Procured", by: req.user._id, note: "Asset added to inventory" }],
  });
  res.status(201).json({ success: true, data: asset });
});

const updateAsset = asyncHandler(async (req, res) => {
  const asset = await Asset.findById(req.params.id);
  if (!asset) {
    res.status(404);
    throw new Error("Asset not found");
  }

  const prevStatus = asset.status;
  Object.assign(asset, req.body);

  if (req.body.status && req.body.status !== prevStatus) {
    asset.lifecycleLog.push({
      action: `Status changed: ${prevStatus} -> ${req.body.status}`,
      by: req.user._id,
      note: req.body.lifecycleNote || "",
    });
  }

  await asset.save();
  res.json({ success: true, data: asset });
});

const deleteAsset = asyncHandler(async (req, res) => {
  const asset = await Asset.findById(req.params.id);
  if (!asset) {
    res.status(404);
    throw new Error("Asset not found");
  }
  asset.status = "Retired";
  asset.lifecycleLog.push({ action: "Retired", by: req.user._id, note: "Asset retired" });
  await asset.save();
  res.json({ success: true, message: "Asset retired" });
});

module.exports = { getAssets, getAsset, createAsset, updateAsset, deleteAsset };
