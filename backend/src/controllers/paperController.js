const Paper = require("../models/Paper");
const PaperVersion = require("../models/PaperVersion");
const ReviewerAssignment = require("../models/ReviewerAssignment");
const Review = require("../models/Review");
const Decision = require("../models/Decision");
const Conference = require("../models/Conference");
const hashService = require("../services/hashService");
const blockchainService = require("../services/blockchainService");
const path = require("path");
const fs = require("fs");

exports.submitPaper = async (req, res, next) => {
  try {
    const { title, abstract, track, keywords, conferenceId } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "PDF document file is required",
      });
    }

    if (!title || !abstract || !track) {
      return res.status(400).json({
        success: false,
        message: "Title, abstract, and track are required fields",
      });
    }

    // 1. Calculate SHA-256 hash of uploaded PDF
    const fileHash = hashService.hashFile(req.file.path);

    // 2. Format keywords
    let parsedKeywords = [];
    if (Array.isArray(keywords)) {
      parsedKeywords = keywords;
    } else if (typeof keywords === "string") {
      try {
        const parsed = JSON.parse(keywords);
        if (Array.isArray(parsed)) {
          parsedKeywords = parsed;
        } else {
          parsedKeywords = [String(parsed)];
        }
      } catch (e) {
        parsedKeywords = keywords.split(",").map((k) => k.trim()).filter(Boolean);
      }
    }

    // 3. Resolve conference
    let conf = null;
    if (conferenceId) {
      conf = await Conference.findById(conferenceId);
    }
    if (!conf) {
      conf = await Conference.findOne({ status: "open" });
    }

    // 4. Create Paper record
    const paper = new Paper({
      title: title.trim(),
      abstract: abstract.trim(),
      track: track.trim(),
      keywords: parsedKeywords,
      conference: conf ? conf._id : null,
      author: req.user._id,
      authorPseudonym: req.user.pseudonymId || req.user.pseudonym,
      currentVersion: 1,
      status: "submitted",
      latestFileHash: fileHash,
      submittedAt: new Date(),
    });

    await paper.save();

    // 5. Create PaperVersion record
    const relativeUrl = `/uploads/papers/${path.basename(req.file.path)}`;
    const versionRecord = new PaperVersion({
      paper: paper._id,
      version: 1,
      filePath: req.file.path,
      fileUrl: relativeUrl,
      originalFileName: req.file.originalname,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      fileHash: fileHash,
      changeLog: "Initial submission",
      submittedAt: new Date(),
    });

    await versionRecord.save();

    // 6. Register on Blockchain
    let blockchainResult = null;
    try {
      blockchainResult = await blockchainService.registerPaper(
        paper.paperCustomId,
        paper.authorPseudonym,
        fileHash,
        paper._id
      );

      paper.blockchainStatus = "confirmed";
      paper.blockchainTxHash = blockchainResult.txHash;
      paper.blockchainBlockNumber = blockchainResult.blockNumber;
      await paper.save();

      versionRecord.blockchainStatus = "confirmed";
      versionRecord.blockchainTxHash = blockchainResult.txHash;
      versionRecord.blockchainBlockNumber = blockchainResult.blockNumber;
      versionRecord.verified = true;
      await versionRecord.save();
    } catch (bcError) {
      console.error("[PaperController] Blockchain registration warning:", bcError.message);
      paper.blockchainStatus = "failed";
      await paper.save();
    }

    res.status(201).json({
      success: true,
      message: "Paper submitted and registered on blockchain",
      paper: {
        id: paper.paperCustomId,
        _id: paper._id,
        title: paper.title,
        abstract: paper.abstract,
        track: paper.track,
        keywords: paper.keywords,
        status: paper.status,
        currentVersion: 1,
        fileHash: fileHash,
        fileUrl: relativeUrl,
        blockchainTxHash: paper.blockchainTxHash,
        blockNumber: paper.blockchainBlockNumber,
        submittedAt: paper.submittedAt,
      },
      blockchain: blockchainResult
        ? {
            txHash: blockchainResult.txHash,
            blockNumber: blockchainResult.blockNumber,
            paperId: paper.paperCustomId,
            fileHash,
            authorPseudonym: paper.authorPseudonym,
            status: "confirmed",
          }
        : null,
    });
  } catch (error) {
    next(error);
  }
};

exports.getMySubmissions = async (req, res, next) => {
  try {
    const papers = await Paper.find({ author: req.user._id }).sort({ createdAt: -1 });

    const formattedPapers = await Promise.all(
      papers.map(async (p) => {
        const versions = await PaperVersion.find({ paper: p._id }).sort({ version: 1 });
        const decision = await Decision.findOne({ paper: p._id });

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
          blockchainTxHash: p.blockchainTxHash,
          blockchainStatus: p.blockchainStatus,
          submittedAt: p.submittedAt,
          versions: versions.map((v) => ({
            version: v.version,
            fileHash: v.fileHash,
            fileUrl: v.fileUrl,
            originalFileName: v.originalFileName,
            fileSize: v.fileSize,
            changeLog: v.changeLog,
            submittedAt: v.submittedAt,
            blockchainTxHash: v.blockchainTxHash,
            blockNumber: v.blockchainBlockNumber,
            verified: v.verified,
          })),
          decision: decision
            ? {
                status: decision.status,
                remarks: decision.remarks || decision.feedbackToAuthor,
                decidedAt: decision.decidedAt,
                blockchainTxHash: decision.blockchainTxHash,
                blockNumber: decision.blockchainBlockNumber,
              }
            : null,
          reviews: [], // Double-blind: individual reviews remain protected
        };
      })
    );

    res.status(200).json({
      success: true,
      papers: formattedPapers,
    });
  } catch (error) {
    next(error);
  }
};

exports.submitVersion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { changeLog } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Revised PDF document file is required",
      });
    }

    const paper = await Paper.findOne({
      $or: [{ paperCustomId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
    });

    if (!paper) {
      return res.status(404).json({ success: false, message: "Paper not found" });
    }

    // Only owner can submit new version
    if (paper.author.toString() !== req.user._id.toString() && req.userRole !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: only the author can submit new revisions for this paper",
      });
    }

    const nextVersion = paper.currentVersion + 1;
    const fileHash = hashService.hashFile(req.file.path);
    const relativeUrl = `/uploads/papers/${path.basename(req.file.path)}`;

    const versionRecord = new PaperVersion({
      paper: paper._id,
      version: nextVersion,
      filePath: req.file.path,
      fileUrl: relativeUrl,
      originalFileName: req.file.originalname,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      fileHash: fileHash,
      changeLog: changeLog || `Revision version ${nextVersion}`,
      submittedAt: new Date(),
    });

    await versionRecord.save();

    paper.currentVersion = nextVersion;
    paper.latestFileHash = fileHash;
    await paper.save();

    // Register on blockchain
    try {
      const bcResult = await blockchainService.registerPaperVersion(
        paper.paperCustomId,
        nextVersion,
        fileHash,
        versionRecord._id,
        paper.authorPseudonym
      );

      versionRecord.blockchainStatus = "confirmed";
      versionRecord.blockchainTxHash = bcResult.txHash;
      versionRecord.blockchainBlockNumber = bcResult.blockNumber;
      versionRecord.verified = true;
      await versionRecord.save();
    } catch (bcError) {
      console.error("[PaperController] Blockchain version registration error:", bcError.message);
      versionRecord.blockchainStatus = "failed";
      await versionRecord.save();
    }

    res.status(201).json({
      success: true,
      message: "New version uploaded and recorded on blockchain",
      paper: {
        id: paper.paperCustomId,
        currentVersion: nextVersion,
        fileHash,
        status: paper.status,
      },
      version: {
        version: nextVersion,
        fileHash,
        fileUrl: relativeUrl,
        changeLog: versionRecord.changeLog,
        blockchainTxHash: versionRecord.blockchainTxHash,
        blockNumber: versionRecord.blockchainBlockNumber,
        submittedAt: versionRecord.submittedAt,
        verified: versionRecord.verified,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getPaperById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const paper = await Paper.findOne({
      $or: [{ paperCustomId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
    }).populate("author", "name email pseudonymId");

    if (!paper) {
      return res.status(404).json({ success: false, message: "Paper not found" });
    }

    const versions = await PaperVersion.find({ paper: paper._id }).sort({ version: 1 });
    const decision = await Decision.findOne({ paper: paper._id });

    const isAuthor = paper.author._id.toString() === req.user._id.toString();
    const isAdmin = req.userRole === "admin";

    // If reviewer, check if assigned
    let isAssignedReviewer = false;
    if (req.userRole === "reviewer") {
      const assignment = await ReviewerAssignment.findOne({
        paper: paper._id,
        reviewer: req.user._id,
      });
      isAssignedReviewer = !!assignment;
    }

    if (!isAuthor && !isAdmin && !isAssignedReviewer) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You are not authorized to access this paper",
      });
    }

    // Double-blind identity protection:
    // If reviewer is viewing: completely remove author name, email, and internal author ID!
    const authorData =
      isAdmin || isAuthor
        ? {
            id: paper.author._id,
            name: paper.author.name,
            email: paper.author.email,
            pseudonymId: paper.authorPseudonym,
          }
        : undefined;

    res.status(200).json({
      success: true,
      paper: {
        id: paper.paperCustomId,
        _id: paper._id,
        title: paper.title,
        abstract: paper.abstract,
        track: paper.track,
        keywords: paper.keywords,
        status: paper.status,
        currentVersion: paper.currentVersion,
        latestFileHash: paper.latestFileHash,
        authorPseudonym: paper.authorPseudonym,
        author: authorData,
        blockchainStatus: paper.blockchainStatus,
        blockchainTxHash: paper.blockchainTxHash,
        blockchainBlockNumber: paper.blockchainBlockNumber,
        submittedAt: paper.submittedAt,
        versions: versions.map((v) => ({
          version: v.version,
          fileHash: v.fileHash,
          fileUrl: v.fileUrl,
          originalFileName: v.originalFileName,
          fileSize: v.fileSize,
          changeLog: v.changeLog,
          submittedAt: v.submittedAt,
          blockchainTxHash: v.blockchainTxHash,
          blockNumber: v.blockchainBlockNumber,
          verified: v.verified,
        })),
        decision: decision
          ? {
              status: decision.status,
              remarks: decision.remarks || decision.feedbackToAuthor,
              decidedAt: decision.decidedAt,
              blockchainTxHash: decision.blockchainTxHash,
            }
          : null,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.downloadPaper = async (req, res, next) => {
  try {
    const { id } = req.params;
    const requestedVersion = req.query.version ? parseInt(req.query.version) : null;

    const paper = await Paper.findOne({
      $or: [{ paperCustomId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
    });

    if (!paper) {
      return res.status(404).json({ success: false, message: "Paper not found" });
    }

    // Authorization check
    const isAuthor = paper.author.toString() === req.user._id.toString();
    const isAdmin = req.userRole === "admin";
    let isAssignedReviewer = false;

    if (req.userRole === "reviewer") {
      const assignment = await ReviewerAssignment.findOne({
        paper: paper._id,
        reviewer: req.user._id,
      });
      isAssignedReviewer = !!assignment;
    }

    if (!isAuthor && !isAdmin && !isAssignedReviewer) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You are not authorized to download this document",
      });
    }

    const versionQuery = requestedVersion
      ? { paper: paper._id, version: requestedVersion }
      : { paper: paper._id, version: paper.currentVersion };

    const versionDoc = await PaperVersion.findOne(versionQuery);
    if (!versionDoc || !fs.existsSync(versionDoc.filePath)) {
      return res.status(404).json({ success: false, message: "Requested paper PDF file not found on disk" });
    }

    res.download(versionDoc.filePath, versionDoc.originalFileName);
  } catch (error) {
    next(error);
  }
};

exports.getVersions = async (req, res, next) => {
  try {
    const { id } = req.params;
    const paper = await Paper.findOne({
      $or: [{ paperCustomId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
    });

    if (!paper) {
      return res.status(404).json({ success: false, message: "Paper not found" });
    }

    const versions = await PaperVersion.find({ paper: paper._id }).sort({ version: 1 });
    res.status(200).json({
      success: true,
      paperId: paper.paperCustomId,
      currentVersion: paper.currentVersion,
      versions: versions.map((v) => ({
        version: v.version,
        fileHash: v.fileHash,
        fileUrl: v.fileUrl,
        originalFileName: v.originalFileName,
        fileSize: v.fileSize,
        changeLog: v.changeLog,
        submittedAt: v.submittedAt,
        blockchainTxHash: v.blockchainTxHash,
        blockNumber: v.blockchainBlockNumber,
        verified: v.verified,
      })),
    });
  } catch (error) {
    next(error);
  }
};
