const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
  {
    ticket: { type: mongoose.Schema.Types.ObjectId, ref: "Ticket", required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    message: { type: String, required: true },
    isInternal: { type: Boolean, default: false }, // internal notes visible only to staff
    attachments: [
      {
        fileName: String,
        fileUrl: String,
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Comment", commentSchema);
