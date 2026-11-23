const mongoose = require("mongoose");

const reviewerAssignmentSchema = new mongoose.Schema(
  {
    paper: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Paper",
      required: true,
    },
    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reviewerPseudonym: {
      type: String,
      required: true,
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    status: {
      type: String,
      enum: ["assigned", "submitted", "declined"],
      default: "assigned",
    },
    reviewStatus: {
      type: String,
      enum: ["pending", "submitted"],
      default: "pending",
    },
    deadline: {
      type: Date,
      default: () => new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
    },
    assignedAt: {
      type: Date,
      default: Date.now,
    },
    blockchainStatus: {
      type: String,
      enum: ["pending", "confirmed", "failed"],
      default: "pending",
    },
    blockchainTxHash: {
      type: String,
      default: null,
    },
    blockchainBlockNumber: {
      type: Number,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

reviewerAssignmentSchema.index({ paper: 1, reviewer: 1 }, { unique: true });

module.exports = mongoose.model("ReviewerAssignment", reviewerAssignmentSchema);
