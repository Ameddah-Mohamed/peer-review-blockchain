const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ResearchPaperTracker Smart Contract", function () {
  let tracker;
  let owner, unauthorizedAccount;

  // Sample test data
  const paperId = "paper_test_001";
  const authorPseudonym = "AUTH-7F3A29";
  const reviewerPseudonym = "REV-B910A1";
  const reviewId = "rev_test_501";

  // SHA-256 test hashes (bytes32 format)
  const fileHashV1 = ethers.keccak256(ethers.toUtf8Bytes("Paper PDF Version 1 Content"));
  const fileHashV2 = ethers.keccak256(ethers.toUtf8Bytes("Paper PDF Version 2 Revised Content"));
  const reviewHash = ethers.keccak256(ethers.toUtf8Bytes("JSON Review payload with scores and comments"));
  const decisionHash = ethers.keccak256(ethers.toUtf8Bytes("Decision remarks: Accepted"));

  beforeEach(async function () {
    [owner, unauthorizedAccount] = await ethers.getSigners();

    const TrackerFactory = await ethers.getContractFactory("ResearchPaperTracker");
    tracker = await TrackerFactory.deploy(owner.address);
    await tracker.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should assign the deployer as owner", async function () {
      expect(await tracker.owner()).to.equal(owner.address);
    });

    it("Should start with 0 audit events", async function () {
      expect(await tracker.getAuditEventsCount()).to.equal(0);
    });
  });

  describe("Paper Registration", function () {
    it("Should register a new paper with version 1", async function () {
      const tx = await tracker.registerPaper(paperId, authorPseudonym, fileHashV1);
      const receipt = await tx.wait();

      expect(receipt.status).to.equal(1);

      const paper = await tracker.getPaper(paperId);
      expect(paper.exists).to.be.true;
      expect(paper.authorPseudonym).to.equal(authorPseudonym);
      expect(paper.currentVersion).to.equal(1);

      const [matches, timestamp, registeredHash] = await tracker.verifyPaperVersionHash(paperId, 1, fileHashV1);
      expect(matches).to.be.true;
      expect(registeredHash).to.equal(fileHashV1);
      expect(timestamp).to.be.gt(0);
    });

    it("Should revert if registering an already existing paper", async function () {
      await tracker.registerPaper(paperId, authorPseudonym, fileHashV1);
      await expect(
        tracker.registerPaper(paperId, authorPseudonym, fileHashV1)
      ).to.be.revertedWith("Paper already registered");
    });

    it("Should revert if unauthorized account tries to register", async function () {
      await expect(
        tracker.connect(unauthorizedAccount).registerPaper(paperId, authorPseudonym, fileHashV1)
      ).to.be.revertedWithCustomError(tracker, "OwnableUnauthorizedAccount");
    });
  });

  describe("Paper Versions", function () {
    beforeEach(async function () {
      await tracker.registerPaper(paperId, authorPseudonym, fileHashV1);
    });

    it("Should register sequential version 2", async function () {
      await tracker.registerPaperVersion(paperId, 2, fileHashV2);

      const paper = await tracker.getPaper(paperId);
      expect(paper.currentVersion).to.equal(2);

      const [matchesV2, _, regV2] = await tracker.verifyPaperVersionHash(paperId, 2, fileHashV2);
      expect(matchesV2).to.be.true;
      expect(regV2).to.equal(fileHashV2);

      const allVersions = await tracker.getAllVersions(paperId);
      expect(allVersions.length).to.equal(2);
      expect(allVersions[0].versionNumber).to.equal(1);
      expect(allVersions[1].versionNumber).to.equal(2);
    });

    it("Should revert non-sequential version registration", async function () {
      await expect(
        tracker.registerPaperVersion(paperId, 3, fileHashV2)
      ).to.be.revertedWith("Invalid sequential version");
    });
  });

  describe("Reviewer Assignment Audit", function () {
    beforeEach(async function () {
      await tracker.registerPaper(paperId, authorPseudonym, fileHashV1);
    });

    it("Should record reviewer assignment in audit events", async function () {
      await tracker.recordReviewerAssignment(paperId, reviewerPseudonym);

      const count = await tracker.getAuditEventsCount();
      expect(count).to.be.gt(0);

      const latestEvent = await tracker.getAuditEvent(count - 1n);
      expect(latestEvent.eventType).to.equal("ReviewerAssigned");
      expect(latestEvent.paperId).to.equal(paperId);
      expect(latestEvent.actorPseudonym).to.equal(reviewerPseudonym);
    });
  });

  describe("Review Submission & Integrity Verification", function () {
    beforeEach(async function () {
      await tracker.registerPaper(paperId, authorPseudonym, fileHashV1);
      await tracker.recordReviewerAssignment(paperId, reviewerPseudonym);
    });

    it("Should register review and verify its hash", async function () {
      const overallScore = 8;
      await tracker.registerReview(reviewId, paperId, reviewerPseudonym, reviewHash, overallScore);

      const review = await tracker.getReview(reviewId);
      expect(review.exists).to.be.true;
      expect(review.paperId).to.equal(paperId);
      expect(review.reviewerPseudonym).to.equal(reviewerPseudonym);
      expect(review.overallScore).to.equal(overallScore);

      const [matches, timestamp, registeredHash] = await tracker.verifyReviewHash(reviewId, reviewHash);
      expect(matches).to.be.true;
      expect(registeredHash).to.equal(reviewHash);
      expect(timestamp).to.be.gt(0);
    });

    it("Should return false when verifying an altered review hash", async function () {
      await tracker.registerReview(reviewId, paperId, reviewerPseudonym, reviewHash, 8);
      const tamperedHash = ethers.keccak256(ethers.toUtf8Bytes("Tampered review comments"));

      const [matches, _, registeredHash] = await tracker.verifyReviewHash(reviewId, tamperedHash);
      expect(matches).to.be.false;
      expect(registeredHash).to.equal(reviewHash);
    });

    it("Should prevent overwriting an existing review", async function () {
      await tracker.registerReview(reviewId, paperId, reviewerPseudonym, reviewHash, 8);
      await expect(
        tracker.registerReview(reviewId, paperId, reviewerPseudonym, reviewHash, 9)
      ).to.be.revertedWith("Review already registered");
    });
  });

  describe("Editorial Decisions", function () {
    beforeEach(async function () {
      await tracker.registerPaper(paperId, authorPseudonym, fileHashV1);
    });

    it("Should record final decision", async function () {
      await tracker.recordDecision(paperId, "accepted", decisionHash);

      const decision = await tracker.getDecision(paperId);
      expect(decision.exists).to.be.true;
      expect(decision.decisionStatus).to.equal("accepted");
      expect(decision.decisionHash).to.equal(decisionHash);
      expect(decision.decidedAt).to.be.gt(0);
    });
  });

  describe("Audit Trail", function () {
    it("Should record complete workflow in audit events", async function () {
      await tracker.registerPaper(paperId, authorPseudonym, fileHashV1);
      await tracker.recordReviewerAssignment(paperId, reviewerPseudonym);
      await tracker.registerReview(reviewId, paperId, reviewerPseudonym, reviewHash, 8);
      await tracker.recordDecision(paperId, "accepted", decisionHash);

      const allEvents = await tracker.getAllAuditEvents();
      expect(allEvents.length).to.equal(4);
      expect(allEvents[0].eventType).to.equal("PaperRegistered");
      expect(allEvents[1].eventType).to.equal("ReviewerAssigned");
      expect(allEvents[2].eventType).to.equal("ReviewSubmitted");
      expect(allEvents[3].eventType).to.equal("DecisionRecorded");
    });
  });
});
