const mongoose = require("mongoose");

const blockchainTransactionSchema = new mongoose.Schema(
  {
    txHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    operationType: {
      type: String,
      enum: [
        "PaperRegistered",
        "VersionRegistered",
        "ReviewerAssigned",
        "ReviewSubmitted",
        "DecisionRecorded",
      ],
      required: true,
    },
    eventType: {
      type: String, // alias for operationType
    },
    entityType: {
      type: String,
      enum: ["Paper", "PaperVersion", "ReviewerAssignment", "Review", "Decision"],
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    paperId: {
      type: String,
      index: true,
    },
    version: {
      type: Number,
      default: 1,
    },
    actorPseudonym: {
      type: String,
      default: null,
    },
    dataHash: {
      type: String,
      default: null,
    },
    blockNumber: {
      type: Number,
      default: null,
    },
    from: {
      type: String,
      default: null,
    },
    to: {
      type: String,
      default: null,
    },
    gasUsed: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "failed"],
      default: "confirmed",
    },
    errorMessage: {
      type: String,
      default: null,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

blockchainTransactionSchema.pre("save", function () {
  if (!this.eventType && this.operationType) {
    this.eventType = this.operationType;
  }
});

module.exports = mongoose.model("BlockchainTransaction", blockchainTransactionSchema);
