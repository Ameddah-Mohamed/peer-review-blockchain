const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    assignment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ReviewerAssignment",
      required: true,
    },
    paper: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Paper",
      required: true,
    },
    paperVersion: {
      type: Number,
      default: 1,
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
    scores: {
      originality: { type: Number, min: 1, max: 10, default: 5 },
      technicalQuality: { type: Number, min: 1, max: 10, default: 5 },
      clarity: { type: Number, min: 1, max: 10, default: 5 },
      relevance: { type: Number, min: 1, max: 10, default: 5 },
    },
    overallScore: {
      type: Number,
      required: true,
      min: 1,
      max: 10,
    },
    recommendation: {
      type: String,
      enum: ["strong_accept", "accept", "borderline", "reject", "strong_reject", "weak_accept", "weak_reject"],
      required: true,
    },
    authorComments: {
      type: String,
      required: [true, "Comments for the author are required"],
    },
    confidentialComments: {
      type: String,
      default: "",
    },
    reviewHash: {
      type: String,
      required: true, // SHA-256 hash of canonical review payload
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
    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Review", reviewSchema);
