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

  console.log("----------------------------------------------------");
  console.log("Database seeded successfully!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
