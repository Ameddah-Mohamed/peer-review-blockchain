const assert = require("assert");
const fs = require("fs");
const path = require("path");
const connectDB = require("../src/config/db");
const app = require("../src/server");
const blockchainService = require("../src/services/blockchainService");

// Simple HTTP helper for testing Express app directly
async function testLifecycle() {
  console.log("====================================================");
  console.log("Starting Full Lifecycle & Blockchain Integration Test");
  console.log("====================================================");

  await connectDB();
  await blockchainService.initialize();

  const Paper = require("../src/models/Paper");
  const PaperVersion = require("../src/models/PaperVersion");
  const ReviewerAssignment = require("../src/models/ReviewerAssignment");
  const Review = require("../src/models/Review");
  const Decision = require("../src/models/Decision");
  const BlockchainTransaction = require("../src/models/BlockchainTransaction");

  await Paper.deleteMany({});
  await PaperVersion.deleteMany({});
  await ReviewerAssignment.deleteMany({});
  await Review.deleteMany({});
  await Decision.deleteMany({});
  await BlockchainTransaction.deleteMany({});

  const server = app.listen(0); // Random open port
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}/api`;
  console.log(`Test server running at ${baseUrl}`);

  try {
    // ----------------------------------------------------
    // 1. Health Check
    // ----------------------------------------------------
    console.log("\n[Test 1] Health Check...");
    const healthRes = await fetch(`${baseUrl}/health`).then((r) => r.json());
    assert.strictEqual(healthRes.status, "healthy");
    assert.strictEqual(healthRes.blockchainInitialized, true);
    console.log("✔ Health check passed. Blockchain initialized:", healthRes.contractAddress);

    // ----------------------------------------------------
    // 2. Authentication & Roles
    // ----------------------------------------------------
    console.log("\n[Test 2] Authentication & Token Issuance...");

    // Author login
    const authorLogin = await fetch(`${baseUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "alice.student@university.edu", password: "AuthorPassword123!" }),
    }).then((r) => r.json());
    assert.strictEqual(authorLogin.success, true);
    assert.strictEqual(authorLogin.user.role, "author");
    const authorToken = authorLogin.token;

    // Reviewer login
    const reviewerLogin = await fetch(`${baseUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "prof.smith@university.edu", password: "ReviewerPassword123!" }),
    }).then((r) => r.json());
    assert.strictEqual(reviewerLogin.success, true);
    assert.strictEqual(reviewerLogin.user.role, "reviewer");
    const reviewerToken = reviewerLogin.token;

    // Admin login
    const adminLogin = await fetch(`${baseUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@conference.edu", password: "AdminPassword123!" }),
    }).then((r) => r.json());
    assert.strictEqual(adminLogin.success, true);
    assert.strictEqual(adminLogin.user.role, "admin");
    const adminToken = adminLogin.token;

    console.log("✔ Logged in as Author, Reviewer, and Admin.");

    // ----------------------------------------------------
    // 3. Paper Submission (PDF Upload + Hash + Blockchain)
    // ----------------------------------------------------
    console.log("\n[Test 3] Paper Submission (v1) by Author...");

    // Generate dummy PDF file
    const samplePdfPath = path.join(__dirname, "test_paper_v1.pdf");
    fs.writeFileSync(samplePdfPath, "%PDF-1.4\n1 0 obj\n<< /Title (Zero-Knowledge Rollup Architecture) >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF");

    const formData = new FormData();
    const fileBlob = new Blob([fs.readFileSync(samplePdfPath)], { type: "application/pdf" });
    formData.append("file", fileBlob, "test_paper_v1.pdf");
    formData.append("title", "Zero-Knowledge Rollup Architecture for Scalable Academic Blockchains");
    formData.append("abstract", "This paper presents a formal construction and empirical evaluation of high-throughput rollups.");
    formData.append("track", "Zero-Knowledge Proofs");
    formData.append("keywords", "zk-rollups, blockchain, scalability, zero-knowledge");

    const submitRes = await fetch(`${baseUrl}/papers`, {
      method: "POST",
      headers: { Authorization: `Bearer ${authorToken}` },
      body: formData,
    }).then((r) => r.json());

    assert.strictEqual(submitRes.success, true);
    assert.ok(submitRes.paper.id);
    assert.ok(submitRes.paper.blockchainTxHash);
    assert.strictEqual(submitRes.paper.currentVersion, 1);
    const paperId = submitRes.paper.id;
    const v1FileHash = submitRes.paper.fileHash;
    console.log("✔ Paper v1 registered on blockchain!");
    console.log(`  Paper ID: ${paperId} | Tx: ${submitRes.paper.blockchainTxHash} | Block: ${submitRes.paper.blockNumber}`);

    // ----------------------------------------------------
    // 4. Submit Revision Version (v2)
    // ----------------------------------------------------
    console.log("\n[Test 4] Submitting Revision Version (v2) by Author...");

    const samplePdfV2Path = path.join(__dirname, "test_paper_v2.pdf");
    fs.writeFileSync(samplePdfV2Path, "%PDF-1.4\n1 0 obj\n<< /Title (Zero-Knowledge Rollup Architecture v2) >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF");

    const formV2 = new FormData();
    const fileV2Blob = new Blob([fs.readFileSync(samplePdfV2Path)], { type: "application/pdf" });
    formV2.append("file", fileV2Blob, "test_paper_v2.pdf");
    formV2.append("changeLog", "Added security proofs and performance benchmarks.");

    const v2Res = await fetch(`${baseUrl}/papers/${paperId}/versions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${authorToken}` },
      body: formV2,
    }).then((r) => r.json());

    assert.strictEqual(v2Res.success, true);
    assert.strictEqual(v2Res.version.version, 2);
    assert.ok(v2Res.version.blockchainTxHash);
    const v2FileHash = v2Res.version.fileHash;
    console.log("✔ Paper v2 registered on blockchain!");
    console.log(`  Version: 2 | Tx: ${v2Res.version.blockchainTxHash} | Hash: ${v2FileHash.slice(0, 16)}...`);

    // ----------------------------------------------------
    // 5. Admin Assigns Reviewer (Double-Blind)
    // ----------------------------------------------------
    console.log("\n[Test 5] Admin Assigns Reviewer to Paper...");

    const assignRes = await fetch(`${baseUrl}/admin/assignments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        paperId,
        reviewerId: reviewerLogin.user.id,
      }),
    }).then((r) => r.json());

    assert.strictEqual(assignRes.success, true);
    assert.ok(assignRes.assignment.blockchainTxHash);
    const assignmentId = assignRes.assignment.id;
    console.log("✔ Reviewer assigned & recorded on blockchain audit log!");
    console.log(`  Assignment ID: ${assignmentId} | Reviewer Pseudonym: ${assignRes.assignment.reviewerPseudonym}`);

    // ----------------------------------------------------
    // 6. Reviewer Views Assigned Papers (Double-Blind Verification)
    // ----------------------------------------------------
    console.log("\n[Test 6] Double-Blind Verification: Reviewer Views Assigned Paper...");

    const assignedRes = await fetch(`${baseUrl}/reviews/assigned`, {
      headers: { Authorization: `Bearer ${reviewerToken}` },
    }).then((r) => r.json());

    assert.strictEqual(assignedRes.success, true);
    assert.ok(assignedRes.assignments.length >= 1);
    const targetAssigned = assignedRes.assignments.find((a) => a.paperId === paperId);
    assert.ok(targetAssigned);
    assert.strictEqual(targetAssigned.author, undefined); // Real author name/email NEVER present
    assert.ok(targetAssigned.authorPseudonym.startsWith("AUTH-"));
    console.log("✔ Double-blind protection verified: Author identity is hidden. Pseudonym:", targetAssigned.authorPseudonym);

    // ----------------------------------------------------
    // 7. Reviewer Submits Peer Review
    // ----------------------------------------------------
    console.log("\n[Test 7] Reviewer Submits Score & Evaluation...");

    const reviewRes = await fetch(`${baseUrl}/reviews`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${reviewerToken}`,
      },
      body: JSON.stringify({
        assignmentId,
        paperId,
        scores: {
          originality: 5,
          technicalQuality: 5,
          clarity: 4,
          relevance: 5,
        },
        overallScore: 4.8,
        recommendation: "strong_accept",
        authorComments: "Exceptional formal proofs and benchmark methodology. Suggested minor edit on section 4.",
        confidentialComments: "Top paper candidate for best paper award.",
      }),
    }).then((r) => r.json());

    assert.strictEqual(reviewRes.success, true);
    assert.ok(reviewRes.review.reviewHash);
    assert.ok(reviewRes.review.blockchainTxHash);
    const reviewId = reviewRes.review.id;
    console.log("✔ Review submitted and integrity hash committed to blockchain!");
    console.log(`  Review ID: ${reviewId} | Hash: ${reviewRes.review.reviewHash.slice(0, 16)}... | Tx: ${reviewRes.review.blockchainTxHash}`);

    // ----------------------------------------------------
    // 8. Author Views Reviews (Double-Blind Verification)
    // ----------------------------------------------------
    console.log("\n[Test 8] Double-Blind Verification: Author Views Reviews...");

    const authorReviewsRes = await fetch(`${baseUrl}/reviews/paper/${paperId}`, {
      headers: { Authorization: `Bearer ${authorToken}` },
    }).then((r) => r.json());

    assert.strictEqual(authorReviewsRes.success, true);
    assert.ok(authorReviewsRes.reviews.length >= 1);
    const reviewForAuthor = authorReviewsRes.reviews[0];
    assert.strictEqual(reviewForAuthor.reviewer, undefined); // Real reviewer name hidden
    assert.ok(reviewForAuthor.reviewerLabel.startsWith("Reviewer #"));
    assert.strictEqual(reviewForAuthor.confidentialComments, undefined); // Confidential comments hidden
    console.log("✔ Double-blind protection verified: Reviewer identity masked as:", reviewForAuthor.reviewerLabel);

    // ----------------------------------------------------
    // 9. Editorial Decision by Admin
    // ----------------------------------------------------
    console.log("\n[Test 9] Admin Records Final Acceptance Decision...");

    const decisionRes = await fetch(`${baseUrl}/admin/decisions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        paperId,
        decision: "accepted",
        remarks: "Paper accepted for oral presentation based on peer reviews.",
      }),
    }).then((r) => r.json());

    assert.strictEqual(decisionRes.success, true);
    assert.strictEqual(decisionRes.decision.status, "accepted");
    assert.ok(decisionRes.decision.blockchainTxHash);
    console.log("✔ Final acceptance decision recorded on blockchain!");
    console.log(`  Status: ${decisionRes.decision.status} | Tx: ${decisionRes.decision.blockchainTxHash}`);

    // ----------------------------------------------------
    // 10. Public Blockchain Verification
    // ----------------------------------------------------
    console.log("\n[Test 10] Public Blockchain Verification...");

    // 10a. Verify hash against smart contract
    const verifyHashRes = await fetch(`${baseUrl}/blockchain/verify-paper`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        paperId,
        fileHash: v1FileHash,
        version: 1,
      }),
    }).then((r) => r.json());

    assert.strictEqual(verifyHashRes.success, true);
    assert.strictEqual(verifyHashRes.verified, true);
    assert.strictEqual(verifyHashRes.matchStatus, "MATCH_CONFIRMED");
    console.log("✔ On-chain hash verification confirmed for Version 1!");

    // 10b. Verify PDF file directly
    const verifyForm = new FormData();
    verifyForm.append("file", new Blob([fs.readFileSync(samplePdfV2Path)], { type: "application/pdf" }), "check_v2.pdf");

    const verifyFileRes = await fetch(`${baseUrl}/blockchain/verify-file`, {
      method: "POST",
      body: verifyForm,
    }).then((r) => r.json());
    console.log("verifyFileRes:", verifyFileRes);

    assert.strictEqual(verifyFileRes.success, true);
    assert.strictEqual(verifyFileRes.verified, true);
    assert.strictEqual(verifyFileRes.matchStatus, "MATCH_CONFIRMED");
    console.log("✔ PDF file upload verification confirmed matching version 2 on-chain!");

    // 10c. Get full on-chain record
    const recordRes = await fetch(`${baseUrl}/blockchain/record/${paperId}`).then((r) => r.json());
    assert.strictEqual(recordRes.success, true);
    assert.strictEqual(recordRes.onChain.currentVersion, 2);
    assert.strictEqual(recordRes.onChain.decision.status, "accepted");
    console.log("✔ Complete on-chain paper status and version history fetched successfully!");

    // ----------------------------------------------------
    // 11. Admin Audit Trail
    // ----------------------------------------------------
    console.log("\n[Test 11] Fetching Admin Blockchain Audit Trail...");

    const auditRes = await fetch(`${baseUrl}/admin/audit-trail`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    }).then((r) => r.json());

    assert.strictEqual(auditRes.success, true);
    assert.ok(auditRes.events.length >= 4);
    const eventTypes = auditRes.events.map((e) => e.eventType);
    assert.ok(eventTypes.includes("PaperRegistered"));
    assert.ok(eventTypes.includes("VersionRegistered"));
    assert.ok(eventTypes.includes("ReviewerAssigned"));
    assert.ok(eventTypes.includes("ReviewSubmitted"));
    assert.ok(eventTypes.includes("DecisionRecorded"));
    console.log("✔ Full audit trail verified with all 5 lifecycle events present!");

    // Cleanup temp files
    if (fs.existsSync(samplePdfPath)) fs.unlinkSync(samplePdfPath);
    if (fs.existsSync(samplePdfV2Path)) fs.unlinkSync(samplePdfV2Path);

    console.log("\n====================================================");
    console.log("🎉 ALL TESTS PASSED: 11 / 11 VERIFICATIONS SUCCESSFUL");
    console.log("====================================================");
    process.exit(0);
  } finally {
    server.close();
  }
}

testLifecycle().catch((err) => {
  console.error("Test failed with error:", err);
  process.exit(1);
});
