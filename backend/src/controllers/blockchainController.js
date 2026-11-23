const blockchainService = require("../services/blockchainService");
const hashService = require("../services/hashService");
const Paper = require("../models/Paper");
const PaperVersion = require("../models/PaperVersion");
const BlockchainTransaction = require("../models/BlockchainTransaction");

exports.verifyPaper = async (req, res, next) => {
  try {
    const { paperId, fileHash, version } = req.body;

    if (!paperId || !fileHash) {
      return res.status(400).json({
        success: false,
        message: "paperId and fileHash are required fields",
      });
    }

    const versionNum = parseInt(version) || 1;

    // 1. Verify against smart contract
    let onChainVerification = null;
    try {
      onChainVerification = await blockchainService.verifyPaperVersionHash(
        paperId,
        versionNum,
        fileHash
      );
    } catch (bcErr) {
      console.warn("[BlockchainController] Error reading on-chain hash:", bcErr.message);
    }

    // 2. Fetch paper from DB if present
    const paper = await Paper.findOne({
      $or: [{ paperCustomId: paperId }, { _id: paperId.match(/^[0-9a-fA-F]{24}$/) ? paperId : null }],
    });

    const versionDoc = paper
      ? await PaperVersion.findOne({ paper: paper._id, version: versionNum })
      : null;

    const txRecord = await BlockchainTransaction.findOne({
      paperId,
      version: versionNum,
      eventType: { $in: ["PaperRegistered", "VersionRegistered"] },
    }).sort({ timestamp: -1 });

    const matches = onChainVerification ? onChainVerification.matches : false;
    let matchStatus = "RECORD_NOT_FOUND";
    if (onChainVerification && onChainVerification.timestamp > 0) {
      matchStatus = matches ? "MATCH_CONFIRMED" : "HASH_MISMATCH";
    }

    const resultPayload = {
      verified: matches,
      matchStatus,
      calculatedHash: fileHash,
      blockchainRecord: {
        paperId,
        version: versionNum,
        onChainHash: onChainVerification ? onChainVerification.registeredHash : null,
        providedHash: fileHash,
        authorPseudonym: paper ? paper.authorPseudonym : "ANONYMOUS",
        blockNumber: txRecord ? txRecord.blockNumber : null,
        blockTimestamp: onChainVerification ? onChainVerification.date : null,
        txHash: txRecord ? txRecord.txHash : (versionDoc ? versionDoc.blockchainTxHash : null),
      },
    };

    res.status(200).json({
      success: true,
      result: resultPayload,
      ...resultPayload,
    });
  } catch (error) {
    next(error);
  }
};

exports.verifyFile = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "PDF file is required for verification",
      });
    }

    const calculatedHash = hashService.hashFile(req.file.path);

    // Check if this hash exists in any PaperVersion (most recent first)
    const versionDoc = await PaperVersion.findOne({ fileHash: calculatedHash })
      .sort({ createdAt: -1 })
      .populate("paper");

    let onChainResult = null;
    let verified = false;

    if (versionDoc && versionDoc.paper) {
      try {
        onChainResult = await blockchainService.verifyPaperVersionHash(
          versionDoc.paper.paperCustomId,
          versionDoc.version,
          calculatedHash
        );
        verified = onChainResult.matches;
      } catch (e) {
        console.warn("[BlockchainController] File verify contract check error:", e.message);
      }
    }

    res.status(200).json({
      success: true,
      calculatedFileHash: calculatedHash,
      verified,
      matchStatus: verified ? "MATCH_CONFIRMED" : versionDoc ? "PENDING_BLOCKCHAIN" : "RECORD_NOT_FOUND",
      record: versionDoc && versionDoc.paper
        ? {
            paperId: versionDoc.paper.paperCustomId,
            paperTitle: versionDoc.paper.title,
            versionNumber: versionDoc.version,
            authorPseudonym: versionDoc.paper.authorPseudonym,
            blockchainBlockNumber: versionDoc.blockchainBlockNumber,
            blockchainTxHash: versionDoc.blockchainTxHash,
            onChainTimestamp: onChainResult ? onChainResult.timestamp : null,
            registrationDate: versionDoc.submittedAt,
          }
        : null,
    });
  } catch (error) {
    next(error);
  }
};

exports.getRecord = async (req, res, next) => {
  try {
    const { paperId } = req.params;

    const onChainRecord = await blockchainService.getPaperOnChain(paperId);
    if (!onChainRecord) {
      return res.status(404).json({
        success: false,
        message: "No blockchain record found for this paper identifier",
      });
    }

    res.status(200).json({
      success: true,
      paperId,
      record: onChainRecord,
      onChain: onChainRecord,
    });
  } catch (error) {
    next(error);
  }
};

exports.getEvents = async (req, res, next) => {
  try {
    const events = await blockchainService.getAllAuditEvents();
    res.status(200).json({
      success: true,
      count: events.length,
      events,
    });
  } catch (error) {
    next(error);
  }
};
