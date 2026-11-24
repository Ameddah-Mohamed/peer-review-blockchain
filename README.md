# Research Paper Submission & Peer-Review Tracker

An academic conference paper submission and peer-review platform utilizing a hybrid architecture with Ethereum smart contracts to ensure timestamped proof-of-existence, double-blind peer review integrity, and tamper-evident editorial audit logs.

---

## 1. Project Overview

Academic peer-review platforms often suffer from trust issues where centralized administrators could silently modify submission dates, tamper with reviews, or alter editorial decisions. This project introduces a hybrid architecture where:
- Confidential documents, reviewer assignments, and user records remain securely managed off-chain.
- SHA-256 hashes of every paper version, reviewer assignment audit events, review integrity proofs, and final editorial decisions are registered immutably on a Solidity smart contract.
- Double-blind anonymity is enforced at the application level: pseudonymous identifiers (`AUTH-XXXXXX`, `REV-XXXXXX`) are used on-chain and in peer-review workflows to decouple real user identities from academic evaluations.

---

## 2. Directory Structure

```
├── backend/                  # Node.js, Express, MongoDB & Hardhat
│   ├── contracts/            # Solidity smart contracts (ResearchPaperTracker.sol)
│   ├── test/                 # Hardhat unit tests for smart contracts
│   ├── tests/                # End-to-end integration test suite
│   ├── scripts/              # Contract deployment & database seed scripts
│   ├── src/
│   │   ├── config/           # MongoDB connection & configuration
│   │   ├── controllers/      # API Controllers (auth, paper, review, admin, blockchain)
│   │   ├── middleware/       # JWT auth, role RBAC, multer file upload, error handling
│   │   ├── models/           # Mongoose schemas (User, Paper, PaperVersion, Review, etc.)
│   │   ├── routes/           # REST API routes
│   │   ├── services/         # Blockchain service (ethers.js) & SHA-256 hash service
│   │   └── server.js         # Express app entrypoint
│   └── hardhat.config.js     # Hardhat EVM network configuration
├── docs/                     # Project specifications & API Contract
│   ├── PROJECT_OVERVIEW.md   # Project background & expectations
│   └── API_CONTRACT.md       # Shared REST API specification for Frontend
└── frontend/                 # React frontend application
```

---

## 3. Quick Start (Backend & Blockchain)

### Prerequisites
- Node.js (v18+)
- MongoDB (running locally on port 27017)

### 1. Setup & Dependencies
```bash
cd backend
npm install
cp .env.example .env
```

### 2. Start Local Blockchain & Deploy Contract
```bash
# Terminal 1: Start Hardhat local node
npm run node:chain

# Terminal 2: Deploy smart contract to local node
npm run deploy:local
```

### 3. Seed Database & Start Server
```bash
# Seed initial conference and demo accounts
npm run seed

# Start backend server
npm start
```
The server will be running on `http://localhost:5001/api`.

### 4. Run Automated Tests
```bash
# Run Smart Contract unit tests
npm run test:contracts

# Run Full End-to-End integration test suite
npm test
```

---

## 4. Pre-configured Demo Accounts

| Role | Email | Password | Pseudonym ID |
|---|---|---|---|
| **Administrator** | `admin@conference.edu` | `AdminPassword123!` | `ADM-342DC4` |
| **Reviewer** | `prof.smith@university.edu` | `ReviewerPassword123!` | `REV-0EBCE8` |
| **Reviewer** | `dr.elena@research.org` | `ReviewerPassword123!` | `REV-7183D2` |
| **Author** | `alice.student@university.edu` | `AuthorPassword123!` | `AUTH-2DE621` |
| **Author** | `bob.student@university.edu` | `AuthorPassword123!` | `AUTH-115EAA` |

---

## 5. Documentation
- [API Contract & Integration Guide](file:///Users/lmouh/Desktop/ensia/4y/blockchain/project/docs/API_CONTRACT.md)
- [Project Overview](file:///Users/lmouh/Desktop/ensia/4y/blockchain/project/docs/PROJECT_OVERVIEW.md)
- [Backend Documentation](file:///Users/lmouh/Desktop/ensia/4y/blockchain/project/backend/README.md)
