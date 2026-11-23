// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ResearchPaperTracker
 * @notice Smart contract for immutable research paper registration, versioning,
 * peer-review integrity hashing, and editorial decision tracking.
 * @dev Enforces double-blind pseudonymity: real user identities are never stored on-chain.
 */
contract ResearchPaperTracker is Ownable {

    struct PaperVersion {
        uint256 versionNumber;
        bytes32 fileHash;
        uint256 timestamp;
    }

    struct Paper {
        string paperId;
        string authorPseudonym;
        uint256 currentVersion;
        uint256 registeredAt;
        bool exists;
    }

    struct ReviewerAssignment {
        string paperId;
        string reviewerPseudonym;
        uint256 assignedAt;
    }

    struct Review {
        string reviewId;
        string paperId;
        string reviewerPseudonym;
        bytes32 reviewHash;
        uint8 overallScore;
        uint256 submittedAt;
        bool exists;
    }

    struct Decision {
        string paperId;
        string decisionStatus;
        bytes32 decisionHash;
        uint256 decidedAt;
        bool exists;
    }

    struct AuditEvent {
        uint256 eventId;
        string eventType; // "PaperRegistered" | "VersionRegistered" | "ReviewerAssigned" | "ReviewSubmitted" | "DecisionRecorded"
        string paperId;
        uint256 version;
        string actorPseudonym;
        bytes32 dataHash;
        uint256 timestamp;
    }

    // Storage Mappings
    mapping(string => Paper) private papers;
    mapping(string => mapping(uint256 => PaperVersion)) private paperVersions;
    mapping(string => uint256[]) private paperVersionList;
    mapping(string => ReviewerAssignment[]) private paperAssignments;
    mapping(string => Review) private reviews;
    mapping(string => string[]) private paperReviewIds;
    mapping(string => Decision) private decisions;

    // Ordered audit log
    AuditEvent[] private auditEvents;

    // Events
    event PaperRegistered(
        string indexed paperId,
        string authorPseudonym,
        bytes32 fileHash,
        uint256 version,
        uint256 timestamp
    );

    event PaperVersionRegistered(
        string indexed paperId,
        uint256 indexed version,
        bytes32 fileHash,
        uint256 timestamp
    );

    event ReviewerAssigned(
        string indexed paperId,
        string reviewerPseudonym,
        uint256 timestamp
    );

    event ReviewSubmitted(
        string indexed reviewId,
        string indexed paperId,
        string reviewerPseudonym,
        bytes32 reviewHash,
        uint8 overallScore,
        uint256 timestamp
    );

    event DecisionRecorded(
        string indexed paperId,
        string decisionStatus,
        bytes32 decisionHash,
        uint256 timestamp
    );

    /**
     * @param initialOwner Address of the backend relayer account that manages contract updates.
     */
    constructor(address initialOwner) Ownable(initialOwner) {}

    // ==========================================
    // Core Registration & Workflow Functions
    // ==========================================

    /**
     * @notice Registers a new research paper and its initial version (v1).
     * @param paperId Unique external paper identifier.
     * @param authorPseudonym Pseudonymous identifier of the author.
     * @param fileHash SHA-256 hash of the initial PDF document.
     */
    function registerPaper(
        string calldata paperId,
        string calldata authorPseudonym,
        bytes32 fileHash
    ) external onlyOwner {
        require(!papers[paperId].exists, "Paper already registered");
        require(bytes(paperId).length > 0, "Empty paperId");
        require(fileHash != bytes32(0), "Empty fileHash");

        papers[paperId] = Paper({
            paperId: paperId,
            authorPseudonym: authorPseudonym,
            currentVersion: 1,
            registeredAt: block.timestamp,
            exists: true
        });

        paperVersions[paperId][1] = PaperVersion({
            versionNumber: 1,
            fileHash: fileHash,
            timestamp: block.timestamp
        });

        paperVersionList[paperId].push(1);

        uint256 eventId = auditEvents.length + 1;
        auditEvents.push(AuditEvent({
            eventId: eventId,
            eventType: "PaperRegistered",
            paperId: paperId,
            version: 1,
            actorPseudonym: authorPseudonym,
            dataHash: fileHash,
            timestamp: block.timestamp
        }));

        emit PaperRegistered(paperId, authorPseudonym, fileHash, 1, block.timestamp);
        emit PaperVersionRegistered(paperId, 1, fileHash, block.timestamp);
    }

    /**
     * @notice Registers a new revision version for an existing paper.
     * @param paperId Unique paper identifier.
     * @param version Expected sequential version number (current + 1).
     * @param fileHash SHA-256 hash of the revised PDF document.
     */
    function registerPaperVersion(
        string calldata paperId,
        uint256 version,
        bytes32 fileHash
    ) external onlyOwner {
        require(papers[paperId].exists, "Paper not found");
        require(version == papers[paperId].currentVersion + 1, "Invalid sequential version");
        require(fileHash != bytes32(0), "Empty fileHash");

        papers[paperId].currentVersion = version;

        paperVersions[paperId][version] = PaperVersion({
            versionNumber: version,
            fileHash: fileHash,
            timestamp: block.timestamp
        });

        paperVersionList[paperId].push(version);

        uint256 eventId = auditEvents.length + 1;
        auditEvents.push(AuditEvent({
            eventId: eventId,
            eventType: "VersionRegistered",
            paperId: paperId,
            version: version,
            actorPseudonym: papers[paperId].authorPseudonym,
            dataHash: fileHash,
            timestamp: block.timestamp
        }));

        emit PaperVersionRegistered(paperId, version, fileHash, block.timestamp);
    }

    /**
     * @notice Records a reviewer assignment event to the audit trail.
     * @param paperId Unique paper identifier.
     * @param reviewerPseudonym Pseudonymous identifier of the reviewer.
     */
    function recordReviewerAssignment(
        string calldata paperId,
        string calldata reviewerPseudonym
    ) external onlyOwner {
        require(papers[paperId].exists, "Paper not found");
        require(bytes(reviewerPseudonym).length > 0, "Empty reviewerPseudonym");

        paperAssignments[paperId].push(ReviewerAssignment({
            paperId: paperId,
            reviewerPseudonym: reviewerPseudonym,
            assignedAt: block.timestamp
        }));

        uint256 eventId = auditEvents.length + 1;
        auditEvents.push(AuditEvent({
            eventId: eventId,
            eventType: "ReviewerAssigned",
            paperId: paperId,
            version: papers[paperId].currentVersion,
            actorPseudonym: reviewerPseudonym,
            dataHash: bytes32(0),
            timestamp: block.timestamp
        }));

        emit ReviewerAssigned(paperId, reviewerPseudonym, block.timestamp);
    }

    /**
     * @notice Registers an immutable integrity proof for a submitted peer review.
     * @param reviewId Unique review identifier.
     * @param paperId Unique paper identifier.
     * @param reviewerPseudonym Pseudonymous identifier of the reviewer.
     * @param reviewHash SHA-256 hash of the review payload (scores and comments).
     * @param overallScore Overall numerical evaluation score.
     */
    function registerReview(
        string calldata reviewId,
        string calldata paperId,
        string calldata reviewerPseudonym,
        bytes32 reviewHash,
        uint8 overallScore
    ) external onlyOwner {
        require(papers[paperId].exists, "Paper not found");
        require(!reviews[reviewId].exists, "Review already registered");
        require(reviewHash != bytes32(0), "Empty reviewHash");

        reviews[reviewId] = Review({
            reviewId: reviewId,
            paperId: paperId,
            reviewerPseudonym: reviewerPseudonym,
            reviewHash: reviewHash,
            overallScore: overallScore,
            submittedAt: block.timestamp,
            exists: true
        });

        paperReviewIds[paperId].push(reviewId);

        uint256 eventId = auditEvents.length + 1;
        auditEvents.push(AuditEvent({
            eventId: eventId,
            eventType: "ReviewSubmitted",
            paperId: paperId,
            version: papers[paperId].currentVersion,
            actorPseudonym: reviewerPseudonym,
            dataHash: reviewHash,
            timestamp: block.timestamp
        }));

        emit ReviewSubmitted(reviewId, paperId, reviewerPseudonym, reviewHash, overallScore, block.timestamp);
    }

    /**
     * @notice Records the final editorial decision for a paper.
     * @param paperId Unique paper identifier.
     * @param decisionStatus Status string ("accepted", "rejected", "revision_requested").
     * @param decisionHash SHA-256 hash of the decision remarks and metadata.
     */
    function recordDecision(
        string calldata paperId,
        string calldata decisionStatus,
        bytes32 decisionHash
    ) external onlyOwner {
        require(papers[paperId].exists, "Paper not found");
        require(bytes(decisionStatus).length > 0, "Empty decisionStatus");

        decisions[paperId] = Decision({
            paperId: paperId,
            decisionStatus: decisionStatus,
            decisionHash: decisionHash,
            decidedAt: block.timestamp,
            exists: true
        });

        uint256 eventId = auditEvents.length + 1;
        auditEvents.push(AuditEvent({
            eventId: eventId,
            eventType: "DecisionRecorded",
            paperId: paperId,
            version: papers[paperId].currentVersion,
            actorPseudonym: "ADMIN",
            dataHash: decisionHash,
            timestamp: block.timestamp
        }));

        emit DecisionRecorded(paperId, decisionStatus, decisionHash, block.timestamp);
    }

    // ==========================================
    // Public Verification & View Functions
    // ==========================================

    /**
     * @notice Verifies if a given file hash matches the on-chain hash for a paper version.
     */
    function verifyPaperVersionHash(
        string calldata paperId,
        uint256 version,
        bytes32 fileHash
    ) external view returns (bool matches, uint256 timestamp, bytes32 registeredHash) {
        if (!papers[paperId].exists) {
            return (false, 0, bytes32(0));
        }
        registeredHash = paperVersions[paperId][version].fileHash;
        timestamp = paperVersions[paperId][version].timestamp;
        matches = (registeredHash != bytes32(0) && registeredHash == fileHash);
    }

    /**
     * @notice Verifies if a given review hash matches the on-chain recorded hash.
     */
    function verifyReviewHash(
        string calldata reviewId,
        bytes32 reviewHash
    ) external view returns (bool matches, uint256 timestamp, bytes32 registeredHash) {
        if (!reviews[reviewId].exists) {
            return (false, 0, bytes32(0));
        }
        registeredHash = reviews[reviewId].reviewHash;
        timestamp = reviews[reviewId].submittedAt;
        matches = (registeredHash != bytes32(0) && registeredHash == reviewHash);
    }

    /**
     * @notice Fetches paper summary details.
     */
    function getPaper(string calldata paperId) external view returns (
        string memory authorPseudonym,
        uint256 currentVersion,
        uint256 registeredAt,
        bool exists
    ) {
        Paper memory p = papers[paperId];
        return (p.authorPseudonym, p.currentVersion, p.registeredAt, p.exists);
    }

    /**
     * @notice Fetches a specific version record of a paper.
     */
    function getVersion(string calldata paperId, uint256 version) external view returns (
        bytes32 fileHash,
        uint256 timestamp
    ) {
        require(papers[paperId].exists, "Paper not found");
        PaperVersion memory v = paperVersions[paperId][version];
        return (v.fileHash, v.timestamp);
    }

    /**
     * @notice Returns all versions registered for a paper.
     */
    function getAllVersions(string calldata paperId) external view returns (PaperVersion[] memory) {
        require(papers[paperId].exists, "Paper not found");
        uint256[] memory vNums = paperVersionList[paperId];
        PaperVersion[] memory list = new PaperVersion[](vNums.length);
        for (uint256 i = 0; i < vNums.length; i++) {
            list[i] = paperVersions[paperId][vNums[i]];
        }
        return list;
    }

    /**
     * @notice Fetches review details.
     */
    function getReview(string calldata reviewId) external view returns (
        string memory paperId,
        string memory reviewerPseudonym,
        bytes32 reviewHash,
        uint8 overallScore,
        uint256 submittedAt,
        bool exists
    ) {
        Review memory r = reviews[reviewId];
        return (r.paperId, r.reviewerPseudonym, r.reviewHash, r.overallScore, r.submittedAt, r.exists);
    }

    /**
     * @notice Fetches decision details for a paper.
     */
    function getDecision(string calldata paperId) external view returns (
        string memory decisionStatus,
        bytes32 decisionHash,
        uint256 decidedAt,
        bool exists
    ) {
        Decision memory d = decisions[paperId];
        return (d.decisionStatus, d.decisionHash, d.decidedAt, d.exists);
    }

    /**
     * @notice Returns the total number of global audit events.
     */
    function getAuditEventsCount() external view returns (uint256) {
        return auditEvents.length;
    }

    /**
     * @notice Returns an audit event by index.
     */
    function getAuditEvent(uint256 index) external view returns (AuditEvent memory) {
        require(index < auditEvents.length, "Index out of range");
        return auditEvents[index];
    }

    /**
     * @notice Returns all audit events recorded on-chain.
     */
    function getAllAuditEvents() external view returns (AuditEvent[] memory) {
        return auditEvents;
    }
}
