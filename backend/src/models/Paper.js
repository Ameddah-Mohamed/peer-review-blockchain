const mongoose = require("mongoose");

const paperSchema = new mongoose.Schema(
  {
    paperCustomId: {
      type: String,
      unique: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },
    abstract: {
      type: String,
      required: [true, "Abstract is required"],
      trim: true,
    },
    keywords: {
      type: [String],
      default: [],
    },
    track: {
      type: String,
      required: [true, "Track is required"],
      trim: true,
    },
    conference: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conference",
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    authorPseudonym: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["submitted", "under_review", "revision_requested", "accepted", "rejected"],
      default: "submitted",
    },
    currentVersion: {
      type: Number,
      default: 1,
    },
    latestFileHash: {
      type: String,
      default: "",
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

paperSchema.pre("save", function () {
  if (!this.paperCustomId) {
    this.paperCustomId = `paper_${this._id.toString()}`;
  }
});

module.exports = mongoose.model("Paper", paperSchema);
