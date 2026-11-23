const mongoose = require("mongoose");

const conferenceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Conference name is required"],
      trim: true,
    },
    acronym: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "Academic conference tracking research submissions on blockchain.",
    },
    submissionDeadline: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days ahead
    },
    reviewDeadline: {
      type: Date,
      default: () => new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days ahead
    },
    status: {
      type: String,
      enum: ["upcoming", "open", "under_review", "completed"],
      default: "open",
    },
    tracks: {
      type: [String],
      default: [
        "Blockchain Architecture",
        "Consensus & Cryptography",
        "Smart Contracts & Security",
        "Decentralized Applications",
        "Privacy & Zero-Knowledge Proofs",
      ],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Conference", conferenceSchema);
