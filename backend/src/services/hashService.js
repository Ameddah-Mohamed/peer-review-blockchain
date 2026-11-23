const crypto = require("crypto");
const fs = require("fs");

class HashService {
  /**
   * Calculate SHA-256 hash of a file buffer or disk file.
   * @param {Buffer|string} input - File buffer or file path
   * @returns {string} 64-character lowercase hex string
   */
  hashFile(input) {
    const hash = crypto.createHash("sha256");
    if (Buffer.isBuffer(input)) {
      hash.update(input);
    } else if (typeof input === "string") {
      const fileBuffer = fs.readFileSync(input);
      hash.update(fileBuffer);
    } else {
      throw new Error("Invalid input type for hashFile. Expected Buffer or file path string.");
    }
    return hash.digest("hex");
  }

  /**
   * Deterministically hash a review object for blockchain integrity verification.
   * @param {object} reviewData
   * @returns {string} 64-character hex string
   */
  hashReview(reviewData) {
    const canonicalPayload = JSON.stringify({
      paperId: String(reviewData.paperId),
      paperVersion: Number(reviewData.paperVersion || 1),
      scores: {
        originality: Number(reviewData.scores?.originality || 0),
        technicalQuality: Number(reviewData.scores?.technicalQuality || 0),
        clarity: Number(reviewData.scores?.clarity || 0),
        relevance: Number(reviewData.scores?.relevance || 0),
      },
      overallScore: Number(reviewData.overallScore || 0),
      recommendation: String(reviewData.recommendation || "").trim().toLowerCase(),
      authorComments: String(reviewData.authorComments || "").trim(),
    });

    return crypto.createHash("sha256").update(canonicalPayload).digest("hex");
  }

  /**
   * Deterministically hash an editorial decision object.
   * @param {object} decisionData
   * @returns {string} 64-character hex string
   */
  hashDecision(decisionData) {
    const canonicalPayload = JSON.stringify({
      paperId: String(decisionData.paperId),
      status: String(decisionData.status || decisionData.decision || "").trim().toLowerCase(),
      remarks: String(decisionData.remarks || decisionData.feedbackToAuthor || "").trim(),
    });

    return crypto.createHash("sha256").update(canonicalPayload).digest("hex");
  }

  /**
   * Converts a 64-character hex hash into a 32-byte Solidity hex string ("0x...").
   * @param {string} hex
   * @returns {string}
   */
  toBytes32(hex) {
    if (!hex) return "0x" + "00".repeat(32);
    const cleanHex = hex.startsWith("0x") ? hex.slice(2) : hex;
    return "0x" + cleanHex.padStart(64, "0").slice(0, 64);
  }
}

module.exports = new HashService();
