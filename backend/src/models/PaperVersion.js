const mongoose = require("mongoose");

const paperVersionSchema = new mongoose.Schema(
  {
    paper: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Paper",
      required: true,
    },
    version: {
      type: Number,
      required: true,
    },
    filePath: {
      type: String,
      required: true,
    },
    fileUrl: {
      type: String,
      required: true,
    },
    originalFileName: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    mimeType: {
      type: String,
      default: "application/pdf",
    },
    fileHash: {
      type: String,
      required: true, // SHA-256 hash (64 hex characters)
    },
    changeLog: {
      type: String,
      default: "Initial submission",
    },
    submittedAt: {
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
    verified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

paperVersionSchema.index({ paper: 1, version: 1 }, { unique: true });

module.exports = mongoose.model("PaperVersion", paperVersionSchema);
