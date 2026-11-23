const mongoose = require("mongoose");

const decisionSchema = new mongoose.Schema(
  {
    paper: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Paper",
      required: true,
      unique: true,
    },
    decidedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    decision: {
      type: String,
      enum: ["accepted", "rejected", "revision_requested"],
      required: true,
    },
    status: {
      type: String,
      enum: ["accepted", "rejected", "revision_requested"],
      required: true,
    },
    remarks: {
      type: String,
      default: "",
    },
    feedbackToAuthor: {
      type: String,
      default: "",
    },
    internalNotes: {
      type: String,
      default: "",
    },
    decisionHash: {
      type: String,
      required: true,
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
    decidedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

decisionSchema.pre("save", function () {
  if (this.decision && !this.status) {
    this.status = this.decision;
  }
  if (this.status && !this.decision) {
    this.decision = this.status;
  }
  if (!this.feedbackToAuthor && this.remarks) {
    this.feedbackToAuthor = this.remarks;
  }
});

module.exports = mongoose.model("Decision", decisionSchema);
