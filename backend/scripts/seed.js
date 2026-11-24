require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../src/config/db");
const User = require("../src/models/User");
const Conference = require("../src/models/Conference");
const Paper = require("../src/models/Paper");
const PaperVersion = require("../src/models/PaperVersion");
const ReviewerAssignment = require("../src/models/ReviewerAssignment");
const Review = require("../src/models/Review");
const Decision = require("../src/models/Decision");
const BlockchainTransaction = require("../src/models/BlockchainTransaction");

async function seed() {
  console.log("----------------------------------------------------");
  console.log("Seeding Database for Academic Conference System...");

  await connectDB();

  // Clear existing collections if desired
  await User.deleteMany({});
  await Conference.deleteMany({});
  await Paper.deleteMany({});
  await PaperVersion.deleteMany({});
  await ReviewerAssignment.deleteMany({});
  await Review.deleteMany({});
  await Decision.deleteMany({});
  await BlockchainTransaction.deleteMany({});

  console.log("Cleared existing database records.");

  // 1. Create Conference
  const conference = await Conference.create({
    name: "International Conference on Decentralized Systems 2026",
    acronym: "ICDS 2026",
    description: "Annual academic conference on peer-to-peer computing, consensus, and blockchain technology.",
    submissionDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    reviewDeadline: new Date(Date.now() + 50 * 24 * 60 * 60 * 1000),
    status: "open",
    tracks: [
      "Blockchain Architecture",
      "Consensus & Cryptography",
      "Smart Contracts & Security",
      "Decentralized Applications",
      "Zero-Knowledge Proofs",
    ],
  });

  console.log("Created Conference:", conference.name);

  // 2. Create Users
  const admin = await User.create({
    name: "Conference Chair (Admin)",
    email: "admin@conference.edu",
    password: "AdminPassword123!",
    role: "admin",
    institution: "ICDS Program Committee",
  });

  const reviewer1 = await User.create({
    name: "Prof. Arthur Smith",
    email: "prof.smith@university.edu",
    password: "ReviewerPassword123!",
    role: "reviewer",
    institution: "Department of Distributed Systems",
    expertise: ["Blockchain Architecture", "Consensus & Cryptography"],
  });

  const reviewer2 = await User.create({
    name: "Dr. Elena Rostova",
    email: "dr.elena@research.org",
    password: "ReviewerPassword123!",
    role: "reviewer",
    institution: "Cryptographic Research Center",
    expertise: ["Zero-Knowledge Proofs", "Smart Contracts & Security"],
  });

  const author1 = await User.create({
    name: "Alice Johnson",
    email: "alice.student@university.edu",
    password: "AuthorPassword123!",
    role: "author",
    institution: "School of Computing",
  });

  const author2 = await User.create({
    name: "Bob Williams",
    email: "bob.student@university.edu",
    password: "AuthorPassword123!",
    role: "author",
    institution: "Faculty of Applied Sciences",
  });

  console.log("Created Users:");
  console.log(`- Admin: ${admin.email} (pass: AdminPassword123!) | Pseudonym: ${admin.pseudonymId}`);
  console.log(`- Reviewer 1: ${reviewer1.email} (pass: ReviewerPassword123!) | Pseudonym: ${reviewer1.pseudonymId}`);
  console.log(`- Reviewer 2: ${reviewer2.email} (pass: ReviewerPassword123!) | Pseudonym: ${reviewer2.pseudonymId}`);
  console.log(`- Author 1: ${author1.email} (pass: AuthorPassword123!) | Pseudonym: ${author1.pseudonymId}`);
  console.log(`- Author 2: ${author2.email} (pass: AuthorPassword123!) | Pseudonym: ${author2.pseudonymId}`);

  // 3. Seed Sample Paper Submission
  const paperId = `paper_${Date.now()}`;
  const paper1 = await Paper.create({
    paperCustomId: paperId,
    title: "Tamper-Evident Peer Review Ledgers using Zero-Knowledge Commitments",
    abstract:
      "Decentralized peer review platforms face severe trade-offs between preserving double-blind reviewer anonymity and proving non-repudiation. In this paper, we propose a hybrid state architecture coupling off-chain content storage with cryptographic hash chains on EVM-compatible ledgers.",
    keywords: ["Blockchain", "Peer Review", "Zero-Knowledge", "Audit Trails", "Integrity Proofs"],
    track: "Blockchain Architecture",
    conference: conference._id,
    author: author1._id,
    authorPseudonym: author1.pseudonymId,
    status: "under_review",
    currentVersion: 1,
    latestFileHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    blockchainStatus: "confirmed",
    blockchainTxHash: "0x3f5c9e218206d405b0a3c7499bf0e238059e0a17300c3b8782a88a09f8c12b7a",
    blockchainBlockNumber: 1,
  });

  const version1 = await PaperVersion.create({
    paper: paper1._id,
    version: 1,
    fileHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    originalFileName: "peer_review_ledger_v1.pdf",
    storedFileName: "sample_paper.pdf",
    filePath: "uploads/sample_paper.pdf",
    fileSize: 1048576,
    fileUrl: "/uploads/sample_paper.pdf",
    blockchainStatus: "confirmed",
    blockchainTxHash: "0x3f5c9e218206d405b0a3c7499bf0e238059e0a17300c3b8782a88a09f8c12b7a",
    blockchainBlockNumber: 1,
    verified: true,
  });

  // 4. Seed Reviewer Assignment
  const assignment = await ReviewerAssignment.create({
    paper: paper1._id,
    reviewer: reviewer1._id,
    assignedBy: admin._id,
    reviewerPseudonym: reviewer1.pseudonymId,
    status: "assigned",
    reviewStatus: "submitted",
    blockchainStatus: "confirmed",
    blockchainTxHash: "0x7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b",
    blockchainBlockNumber: 2,
  });

  // 5. Seed Review
  const review = await Review.create({
    paper: paper1._id,
    reviewer: reviewer1._id,
    assignment: assignment._id,
    reviewerPseudonym: reviewer1.pseudonymId,
    scores: { originality: 9, methodology: 8, clarity: 9, significance: 9 },
    overallScore: 9,
    recommendation: "accept",
    authorComments: "Outstanding contribution to decentralized peer review mechanisms. Solid cryptographic construction.",
    confidentialComments: "Strong candidate for best paper award.",
    reviewHash: "a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0",
    blockchainStatus: "confirmed",
    blockchainTxHash: "0x9f8e7d6c5b4a3928170f1e2d3c4b5a69788796a5b4c3d2e1f0e9d8c7b6a5f4e3",
    blockchainBlockNumber: 3,
  });

  // 6. Seed Blockchain Audit Events
  await BlockchainTransaction.create([
    {
      txHash: "0x3f5c9e218206d405b0a3c7499bf0e238059e0a17300c3b8782a88a09f8c12b7a",
      blockNumber: 1,
      operationType: "PaperRegistered",
      eventType: "PaperRegistered",
      paperId: paper1.paperCustomId,
      version: 1,
      actorPseudonym: author1.pseudonymId,
      dataHash: paper1.latestFileHash,
      status: "confirmed",
    },
    {
      txHash: "0x7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b",
      blockNumber: 2,
      operationType: "ReviewerAssigned",
      eventType: "ReviewerAssigned",
      paperId: paper1.paperCustomId,
      actorPseudonym: admin.pseudonymId,
      dataHash: "0x" + reviewer1.pseudonymId.padEnd(64, "0"),
      status: "confirmed",
    },
    {
      txHash: "0x9f8e7d6c5b4a3928170f1e2d3c4b5a69788796a5b4c3d2e1f0e9d8c7b6a5f4e3",
      blockNumber: 3,
      operationType: "ReviewSubmitted",
      eventType: "ReviewSubmitted",
      paperId: paper1.paperCustomId,
      actorPseudonym: reviewer1.pseudonymId,
      dataHash: review.reviewHash,
      status: "confirmed",
    },
  ]);

  console.log(`- Created Paper: ${paper1.title} (${paper1.paperCustomId})`);
  console.log(`- Created Assignment & Review for ${reviewer1.email}`);

  console.log("----------------------------------------------------");
  console.log("Database seeded successfully!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
