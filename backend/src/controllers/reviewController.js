const Review = require("../models/Review");
const ReviewerAssignment = require("../models/ReviewerAssignment");
const Paper = require("../models/Paper");
const PaperVersion = require("../models/PaperVersion");
const hashService = require("../services/hashService");
const blockchainService = require("../services/blockchainService");

exports.getAssignedPapers = async (req, res, next) => {
  try {
    const assignments = await ReviewerAssignment.find({ reviewer: req.user._id })
      .populate("paper")
      .sort({ createdAt: -1 });

    const formatted = await Promise.all(
      assignments.map(async (a) => {
        if (!a.paper) return null;

        const latestVersion = await PaperVersion.findOne({
          paper: a.paper._id,
          version: a.paper.currentVersion,
        });

        const existingReview = await Review.findOne({
          assignment: a._id,
        });

        return {
          id: a._id.toString(),
          assignmentId: a._id.toString(),
          paperId: a.paper.paperCustomId,
          title: a.paper.title,
          abstract: a.paper.abstract,
          track: a.paper.track,
          keywords: a.paper.keywords,
          authorPseudonym: a.paper.authorPseudonym, // DOUBLE-BLIND: Real author name/email hidden!
          currentVersion: a.paper.currentVersion,
          fileUrl: latestVersion ? latestVersion.fileUrl : null,
          fileHash: latestVersion ? latestVersion.fileHash : a.paper.latestFileHash,
          assignedAt: a.assignedAt,
          deadline: a.deadline,
          reviewStatus: existingReview ? "submitted" : "pending",
          review: existingReview
            ? {
                id: existingReview._id.toString(),
                scores: existingReview.scores,
                overallScore: existingReview.overallScore,
                recommendation: existingReview.recommendation,
                authorComments: existingReview.authorComments,
                reviewHash: existingReview.reviewHash,
                blockchainTxHash: existingReview.blockchainTxHash,
                submittedAt: existingReview.submittedAt,
              }
            : null,
        };
      })
    );

    res.status(200).json({
      success: true,
      assignments: formatted.filter(Boolean),
    });
  } catch (error) {
    next(error);
  }
};

exports.submitReview = async (req, res, next) => {
  try {
    const {
      assignmentId,
      paperId,
      scores,
      overallScore,
      recommendation,
      authorComments,
      confidentialComments,
    } = req.body;

    if (!paperId || !scores || overallScore === undefined || !recommendation || !authorComments) {
      return res.status(400).json({
        success: false,
        message: "Missing required review fields: paperId, scores, overallScore, recommendation, authorComments",
      });
    }

    // 1. Locate paper
    const paper = await Paper.findOne({
      $or: [{ paperCustomId: paperId }, { _id: paperId.match(/^[0-9a-fA-F]{24}$/) ? paperId : null }],
    });

    if (!paper) {
      return res.status(404).json({ success: false, message: "Paper not found" });
    }

    // 2. Prevent author from reviewing their own paper
    if (paper.author.toString() === req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Double-blind integrity violation: Author cannot review their own paper",
      });
    }

    // 3. Locate or verify assignment
    let assignment = null;
    if (assignmentId && assignmentId.match(/^[0-9a-fA-F]{24}$/)) {
      assignment = await ReviewerAssignment.findById(assignmentId);
    }
    if (!assignment) {
      assignment = await ReviewerAssignment.findOne({
        paper: paper._id,
        reviewer: req.user._id,
      });
    }

    if (!assignment || assignment.reviewer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You are not assigned to review this paper",
      });
    }

    // Check if review already submitted
    const existingReview = await Review.findOne({ assignment: assignment._id });
    if (existingReview) {
      return res.status(409).json({
        success: false,
        message: "A review has already been submitted for this assignment. Reviews cannot be modified after registration.",
      });
    }

    // 4. Calculate review integrity hash
    const reviewPayloadForHash = {
      paperId: paper.paperCustomId,
      paperVersion: paper.currentVersion,
      scores,
      overallScore: Number(overallScore),
      recommendation,
      authorComments,
    };
    const reviewHash = hashService.hashReview(reviewPayloadForHash);

    // 5. Create Review document
    const reviewerPseudonym = req.user.pseudonymId || req.user.pseudonym;
    const review = new Review({
      assignment: assignment._id,
      paper: paper._id,
      paperVersion: paper.currentVersion,
      reviewer: req.user._id,
      reviewerPseudonym,
      scores: {
        originality: scores.originality || 5,
        technicalQuality: scores.technicalQuality || 5,
        clarity: scores.clarity || 5,
        relevance: scores.relevance || 5,
      },
      overallScore: Number(overallScore),
      recommendation,
      authorComments: authorComments.trim(),
      confidentialComments: confidentialComments ? confidentialComments.trim() : "",
      reviewHash,
      submittedAt: new Date(),
    });

    await review.save();

    // 6. Update Assignment status
    assignment.reviewStatus = "submitted";
    assignment.status = "submitted";
    await assignment.save();

    // 7. Update Paper status to 'under_review'
    if (paper.status === "submitted") {
      paper.status = "under_review";
      await paper.save();
    }

    // 8. Register on Blockchain
    const reviewCustomId = `rev_${review._id.toString()}`;
    let blockchainResult = null;
    try {
      blockchainResult = await blockchainService.registerReview(
        reviewCustomId,
        paper.paperCustomId,
        reviewerPseudonym,
        reviewHash,
        Number(overallScore),
        review._id
      );

      review.blockchainStatus = "confirmed";
      review.blockchainTxHash = blockchainResult.txHash;
      review.blockchainBlockNumber = blockchainResult.blockNumber;
      await review.save();
    } catch (bcError) {
      console.error("[ReviewController] Blockchain review registration error:", bcError.message);
      review.blockchainStatus = "failed";
      await review.save();
    }

    res.status(201).json({
      success: true,
      message: "Review submitted and hash recorded on blockchain",
      review: {
        id: reviewCustomId,
        _id: review._id,
        paperId: paper.paperCustomId,
        scores: review.scores,
        overallScore: review.overallScore,
        recommendation: review.recommendation,
        reviewHash,
        blockchainTxHash: review.blockchainTxHash,
        blockNumber: review.blockchainBlockNumber,
        submittedAt: review.submittedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getReviewHistory = async (req, res, next) => {
  try {
    const reviews = await Review.find({ reviewer: req.user._id })
      .populate("paper", "paperCustomId title track currentVersion")
      .sort({ createdAt: -1 });

    const formatted = reviews.map((r) => ({
      id: `rev_${r._id.toString()}`,
      _id: r._id,
      paperId: r.paper ? r.paper.paperCustomId : "unknown",
      paperTitle: r.paper ? r.paper.title : "unknown",
      scores: r.scores,
      overallScore: r.overallScore,
      recommendation: r.recommendation,
      authorComments: r.authorComments,
      reviewHash: r.reviewHash,
      blockchainTxHash: r.blockchainTxHash,
      blockNumber: r.blockchainBlockNumber,
      blockchainStatus: r.blockchainStatus,
      submittedAt: r.submittedAt,
    }));

    res.status(200).json({
      success: true,
      reviews: formatted,
    });
  } catch (error) {
    next(error);
  }
};

exports.getPaperReviews = async (req, res, next) => {
  try {
    const { paperId } = req.params;

    const paper = await Paper.findOne({
      $or: [{ paperCustomId: paperId }, { _id: paperId.match(/^[0-9a-fA-F]{24}$/) ? paperId : null }],
    });

    if (!paper) {
      return res.status(404).json({ success: false, message: "Paper not found" });
    }

    const isAuthor = paper.author.toString() === req.user._id.toString();
    const isAdmin = req.userRole === "admin";
    const isReviewer = req.userRole === "reviewer";

    const reviews = await Review.find({ paper: paper._id }).populate("reviewer", "name email");

    // Double-blind anonymization logic:
    // If requester is Author:
    // - Masks reviewer names with "Reviewer #1", "Reviewer #2"
    // - Omits confidentialComments completely!
    let formattedReviews = [];
    if (isAuthor) {
      formattedReviews = reviews.map((r, index) => ({
        id: `rev_${r._id.toString()}`,
        reviewerLabel: `Reviewer #${index + 1}`,
        scores: r.scores,
        overallScore: r.overallScore,
        recommendation: r.recommendation,
        authorComments: r.authorComments,
        reviewHash: r.reviewHash,
        blockchainTxHash: r.blockchainTxHash,
        submittedAt: r.submittedAt,
      }));
    } else if (isReviewer) {
      // Reviewer only sees their own review
      formattedReviews = reviews
        .filter((r) => r.reviewer._id.toString() === req.user._id.toString())
        .map((r) => ({
          id: `rev_${r._id.toString()}`,
          scores: r.scores,
          overallScore: r.overallScore,
          recommendation: r.recommendation,
          authorComments: r.authorComments,
          confidentialComments: r.confidentialComments,
          reviewHash: r.reviewHash,
          blockchainTxHash: r.blockchainTxHash,
          submittedAt: r.submittedAt,
        }));
    } else if (isAdmin) {
      // Admin sees everything
      formattedReviews = reviews.map((r) => ({
        id: `rev_${r._id.toString()}`,
        reviewer: {
          id: r.reviewer._id,
          name: r.reviewer.name,
          email: r.reviewer.email,
          pseudonymId: r.reviewerPseudonym,
        },
        scores: r.scores,
        overallScore: r.overallScore,
        recommendation: r.recommendation,
        authorComments: r.authorComments,
        confidentialComments: r.confidentialComments,
        reviewHash: r.reviewHash,
        blockchainTxHash: r.blockchainTxHash,
        blockNumber: r.blockchainBlockNumber,
        submittedAt: r.submittedAt,
      }));
    }

    res.status(200).json({
      success: true,
      reviews: formattedReviews,
    });
  } catch (error) {
    next(error);
  }
};
