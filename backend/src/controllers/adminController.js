const Paper = require("../models/Paper");
const PaperVersion = require("../models/PaperVersion");
const ReviewerAssignment = require("../models/ReviewerAssignment");
const Review = require("../models/Review");
const Decision = require("../models/Decision");
const User = require("../models/User");
const BlockchainTransaction = require("../models/BlockchainTransaction");
const hashService = require("../services/hashService");
const blockchainService = require("../services/blockchainService");

exports.getOverview = async (req, res, next) => {
  try {
    const totalPapers = await Paper.countDocuments();
    const submitted = await Paper.countDocuments({ status: "submitted" });
    const underReview = await Paper.countDocuments({ status: "under_review" });
    const accepted = await Paper.countDocuments({ status: "accepted" });
    const rejected = await Paper.countDocuments({ status: "rejected" });
    const revisionRequested = await Paper.countDocuments({ status: "revision_requested" });

    const totalReviewers = await User.countDocuments({ role: "reviewer" });
    const totalAuthors = await User.countDocuments({ role: "author" });
    const totalReviewsExpected = await ReviewerAssignment.countDocuments();
    const totalReviewsCompleted = await Review.countDocuments();
    const blockchainEventsCount = await BlockchainTransaction.countDocuments({ status: "confirmed" });

    let latestBlockNumber = 1;
    try {
      if (blockchainService.provider) {
        const blockPromise = blockchainService.provider.getBlockNumber();
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("RPC_TIMEOUT")), 2000)
        );
        latestBlockNumber = await Promise.race([blockPromise, timeoutPromise]);
      }
    } catch (e) {
      const lastTx = await BlockchainTransaction.findOne().sort({ blockNumber: -1 });
      latestBlockNumber = lastTx ? lastTx.blockNumber : 1;
    }

    res.status(200).json({
      success: true,
      stats: {
        totalPapers,
        submitted,
        underReview,
        accepted,
        rejected,
        revisionRequested,
        totalReviewers,
        totalAuthors,
        totalReviewsExpected,
        totalReviewsCompleted,
        blockchainEventsCount,
        latestBlockNumber: Number(latestBlockNumber),
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getUsers = async (req, res, next) => {
  try {
    const { role } = req.query;
    const filter = {};
    if (role) {
      if (role === "admin" || role === "administrator") {
        filter.role = { $in: ["admin", "administrator"] };
      } else {
        filter.role = role.toLowerCase();
      }
    }

    const users = await User.find(filter).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      users: users.map((u) => ({
        id: u._id.toString(),
        name: u.name,
        email: u.email,
        role: u.role === "administrator" ? "admin" : u.role,
        pseudonymId: u.pseudonymId || u.pseudonym,
        institution: u.institution,
        expertise: u.expertise,
        createdAt: u.createdAt,
      })),
    });
  } catch (error) {
    next(error);
  }
};

exports.updateUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role || !["author", "reviewer", "admin", "administrator"].includes(role.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: "Valid role is required ('author', 'reviewer', 'admin')",
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    user.role = role.toLowerCase() === "administrator" ? "admin" : role.toLowerCase();
    await user.save();

    res.status(200).json({
      success: true,
      message: "User role updated successfully",
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        pseudonymId: user.pseudonymId || user.pseudonym,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getSubmissions = async (req, res, next) => {
  try {
    const papers = await Paper.find().populate("author", "name email pseudonymId").sort({ createdAt: -1 });

    const submissions = await Promise.all(
      papers.map(async (p) => {
        const assignments = await ReviewerAssignment.find({ paper: p._id }).populate(
          "reviewer",
          "name email pseudonymId"
        );
        const reviews = await Review.find({ paper: p._id }).populate("reviewer", "name email pseudonymId");
        const decision = await Decision.findOne({ paper: p._id });
        const versions = await PaperVersion.find({ paper: p._id }).sort({ version: 1 });

        return {
          id: p.paperCustomId,
          _id: p._id,
          title: p.title,
          abstract: p.abstract,
          track: p.track,
          keywords: p.keywords,
          status: p.status,
          currentVersion: p.currentVersion,
          latestFileHash: p.latestFileHash,
          authorPseudonym: p.authorPseudonym,
          author: p.author
            ? {
                id: p.author._id,
                name: p.author.name,
                email: p.author.email,
                pseudonymId: p.authorPseudonym,
              }
            : {
                id: "unknown",
                name: "Author",
                email: "author@unknown",
                pseudonymId: p.authorPseudonym || "AUTH-000000",
              },
          assignedReviewerCount: assignments.length,
          completedReviewCount: reviews.length,
          assignments: assignments.map((a) => ({
            id: a._id.toString(),
            reviewerId: a.reviewer ? a.reviewer._id.toString() : "unknown",
            reviewerName: a.reviewer ? a.reviewer.name : "Reviewer",
            reviewerEmail: a.reviewer ? a.reviewer.email : "",
            reviewerPseudonym: a.reviewerPseudonym,
            status: a.status,
            reviewStatus: a.reviewStatus,
            assignedAt: a.assignedAt,
          })),
          reviews: reviews.map((r) => ({
            id: `rev_${r._id.toString()}`,
            reviewerName: r.reviewer ? r.reviewer.name : "Reviewer",
            reviewerPseudonym: r.reviewerPseudonym,
            scores: r.scores,
            overallScore: r.overallScore,
            recommendation: r.recommendation,
            authorComments: r.authorComments,
            confidentialComments: r.confidentialComments,
            reviewHash: r.reviewHash,
            blockchainTxHash: r.blockchainTxHash,
            submittedAt: r.submittedAt,
          })),
          decision: decision
            ? {
                status: decision.status,
                remarks: decision.remarks || decision.feedbackToAuthor,
                decidedAt: decision.decidedAt,
                blockchainTxHash: decision.blockchainTxHash,
              }
            : null,
          versions: versions.map((v) => ({
            version: v.version,
            fileHash: v.fileHash,
            fileUrl: v.fileUrl,
            originalFileName: v.originalFileName,
            fileSize: v.fileSize,
            submittedAt: v.submittedAt,
            blockchainTxHash: v.blockchainTxHash,
            verified: v.verified,
          })),
          submittedAt: p.submittedAt,
        };
      })
    );

    res.status(200).json({
      success: true,
      papers: submissions,
      submissions,
    });
  } catch (error) {
    next(error);
  }
};

exports.assignReviewer = async (req, res, next) => {
  try {
    const { paperId, reviewerId } = req.body;

    if (!paperId || !reviewerId) {
      return res.status(400).json({
        success: false,
        message: "paperId and reviewerId are required",
      });
    }

    const paper = await Paper.findOne({
      $or: [{ paperCustomId: paperId }, { _id: paperId.match(/^[0-9a-fA-F]{24}$/) ? paperId : null }],
    });

    if (!paper) {
      return res.status(404).json({ success: false, message: "Paper not found" });
    }

    const reviewer = await User.findById(reviewerId);
    if (!reviewer) {
      return res.status(404).json({ success: false, message: "Reviewer user not found" });
    }

    // Double-blind constraint: Author cannot be assigned as reviewer of their own paper
    if (paper.author.toString() === reviewer._id.toString()) {
      return res.status(400).json({
        success: false,
        message: "Conflict of interest: Cannot assign paper author as reviewer",
      });
    }

    // Check if already assigned
    const existing = await ReviewerAssignment.findOne({
      paper: paper._id,
      reviewer: reviewer._id,
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "This reviewer is already assigned to this paper",
      });
    }

    const reviewerPseudonym = reviewer.pseudonymId || reviewer.pseudonym;
    const assignment = new ReviewerAssignment({
      paper: paper._id,
      reviewer: reviewer._id,
      reviewerPseudonym,
      assignedBy: req.user._id,
      assignedAt: new Date(),
    });

    await assignment.save();

    // Update paper status to under_review
    if (paper.status === "submitted") {
      paper.status = "under_review";
      await paper.save();
    }

    // Record on blockchain audit log
    try {
      const bcResult = await blockchainService.recordReviewerAssignment(
        paper.paperCustomId,
        reviewerPseudonym,
        assignment._id
      );

      assignment.blockchainStatus = "confirmed";
      assignment.blockchainTxHash = bcResult.txHash;
      assignment.blockchainBlockNumber = bcResult.blockNumber;
      await assignment.save();
    } catch (bcError) {
      console.error("[AdminController] Blockchain reviewer assignment error:", bcError.message);
      assignment.blockchainStatus = "failed";
      await assignment.save();
    }

    res.status(201).json({
      success: true,
      message: "Reviewer assigned successfully",
      assignment: {
        id: assignment._id.toString(),
        paperId: paper.paperCustomId,
        reviewerId: reviewer._id.toString(),
        reviewerName: reviewer.name,
        reviewerPseudonym,
        status: assignment.status,
        blockchainTxHash: assignment.blockchainTxHash,
        assignedAt: assignment.assignedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.removeAssignment = async (req, res, next) => {
  try {
    const { assignmentId } = req.params;

    const assignment = await ReviewerAssignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ success: false, message: "Assignment not found" });
    }

    // Check if a review was already submitted
    const existingReview = await Review.findOne({ assignment: assignment._id });
    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: "Cannot remove assignment after a peer review has already been submitted",
      });
    }

    await ReviewerAssignment.findByIdAndDelete(assignmentId);

    res.status(200).json({
      success: true,
      message: "Assignment removed successfully",
    });
  } catch (error) {
    next(error);
  }
};

exports.recordDecision = async (req, res, next) => {
  try {
    const { paperId, decision, remarks } = req.body;

    if (!paperId || !decision) {
      return res.status(400).json({
        success: false,
        message: "paperId and decision are required",
      });
    }

    const normalizedDecision = decision.toLowerCase().trim();
    if (!["accepted", "rejected", "revision_requested"].includes(normalizedDecision)) {
      return res.status(400).json({
        success: false,
        message: "Invalid decision status. Allowed: 'accepted', 'rejected', 'revision_requested'",
      });
    }

    const paper = await Paper.findOne({
      $or: [{ paperCustomId: paperId }, { _id: paperId.match(/^[0-9a-fA-F]{24}$/) ? paperId : null }],
    });

    if (!paper) {
      return res.status(404).json({ success: false, message: "Paper not found" });
    }

    // Generate canonical decision hash
    const decisionHash = hashService.hashDecision({
      paperId: paper.paperCustomId,
      decision: normalizedDecision,
      remarks: remarks || "",
    });

    let decisionDoc = await Decision.findOne({ paper: paper._id });
    if (decisionDoc) {
      decisionDoc.decision = normalizedDecision;
      decisionDoc.status = normalizedDecision;
      decisionDoc.remarks = remarks || "";
      decisionDoc.feedbackToAuthor = remarks || "";
      decisionDoc.decisionHash = decisionHash;
      decisionDoc.decidedBy = req.user._id;
      decisionDoc.decidedAt = new Date();
    } else {
      decisionDoc = new Decision({
        paper: paper._id,
        decidedBy: req.user._id,
        decision: normalizedDecision,
        status: normalizedDecision,
        remarks: remarks || "",
        feedbackToAuthor: remarks || "",
        decisionHash,
        decidedAt: new Date(),
      });
    }

    await decisionDoc.save();

    // Update paper status
    paper.status = normalizedDecision;
    await paper.save();

    // Commit to blockchain
    try {
      const bcResult = await blockchainService.recordDecision(
        paper.paperCustomId,
        normalizedDecision,
        decisionHash,
        decisionDoc._id
      );

      decisionDoc.blockchainStatus = "confirmed";
      decisionDoc.blockchainTxHash = bcResult.txHash;
      decisionDoc.blockchainBlockNumber = bcResult.blockNumber;
      await decisionDoc.save();
    } catch (bcError) {
      console.error("[AdminController] Blockchain decision recording error:", bcError.message);
      decisionDoc.blockchainStatus = "failed";
      await decisionDoc.save();
    }

    res.status(200).json({
      success: true,
      message: "Decision recorded on blockchain",
      paper: {
        id: paper.paperCustomId,
        _id: paper._id,
        status: normalizedDecision,
        currentVersion: paper.currentVersion,
        decision: {
          status: normalizedDecision,
          remarks: decisionDoc.remarks,
          blockchainTxHash: decisionDoc.blockchainTxHash,
          blockNumber: decisionDoc.blockchainBlockNumber,
          decidedAt: decisionDoc.decidedAt,
        },
      },
      decision: {
        paperId: paper.paperCustomId,
        status: normalizedDecision,
        remarks: decisionDoc.remarks,
        blockchainTxHash: decisionDoc.blockchainTxHash,
        blockNumber: decisionDoc.blockchainBlockNumber,
        decidedAt: decisionDoc.decidedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getAuditTrail = async (req, res, next) => {
  try {
    const transactions = await BlockchainTransaction.find().sort({ timestamp: -1 });

    const formattedEvents = transactions.map((t) => ({
      id: t._id.toString(),
      eventType: t.eventType || t.operationType,
      paperId: t.paperId,
      version: t.version,
      actorPseudonym: t.actorPseudonym,
      dataHash: t.dataHash,
      txHash: t.txHash,
      blockNumber: t.blockNumber,
      status: t.status,
      timestamp: t.timestamp,
    }));

    res.status(200).json({
      success: true,
      events: formattedEvents,
    });
  } catch (error) {
    next(error);
  }
};
