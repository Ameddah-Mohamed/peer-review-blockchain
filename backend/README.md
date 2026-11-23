# Research Paper Submission & Peer-Review Tracker: Backend & Blockchain

This is the backend and blockchain component of the academic **Research Paper Submission & Peer-Review Tracker**. It implements a secure hybrid architecture combining off-chain document storage and double-blind identity protection with on-chain cryptographic immutability and verifiable proofs on Ethereum/EVM.

---

## 1. Architecture & Design Decisions

### 1.1 Hybrid On-Chain / Off-Chain Architecture
- **Off-Chain (Node.js, Express, MongoDB, Filesystem):**
  - Manages full PDF documents, user accounts, password hashes (bcrypt), and authorization tokens (JWT).
  - Enforces strict Role-Based Access Control (RBAC) on all operations.
  - Handles double-blind identity protection: masks author identities for reviewers and masks reviewer identities for authors.
- **On-Chain (Solidity Smart Contract via Hardhat & ethers.js):**
  - Immutably records paper registrations, sequential revisions, reviewer assignments, peer review integrity hashes, and editorial decisions.
  - Real identities (names, emails, user IDs) are **never** stored on-chain. Only pseudonymous identifiers (`AUTH-XXXXXX`, `REV-XXXXXX`) and cryptographic SHA-256 hashes (`bytes32`) are committed to the blockchain.
  - Exposes public view functions (`verifyPaperVersionHash`, `verifyReviewHash`, `getPaper`, `getAllAuditEvents`) enabling anyone to independently verify document integrity and registration timestamps.

### 1.2 Cryptographic Integrity Model
- **PDF Documents:** When an author submits a paper or revision, the backend computes its SHA-256 hash from the binary buffer and submits it to `registerPaper` or `registerPaperVersion` on-chain.
- **Peer Reviews:** When a reviewer submits evaluations and feedback, the backend computes a canonical SHA-256 hash of the review payload and registers it via `registerReview`. Because the smart contract checks `!reviews[reviewId].exists`, submitted reviews cannot be secretly modified or overwritten.
- **Editorial Decisions:** Final acceptance or rejection decisions are hashed and committed via `recordDecision`.

---

## 2. Prerequisites & Setup Instructions

### Prerequisites
- **Node.js**: v18+ (tested on v26)
- **MongoDB**: v6+ (running on `mongodb://127.0.0.1:27017`)
- **Hardhat**: included in `devDependencies`

### Step 1: Install Dependencies
```bash
cd backend
npm install
```

### Step 2: Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Default configuration points to local MongoDB (`mongodb://127.0.0.1:27017/peer_review_tracker`) and the Hardhat local node (`http://127.0.0.1:8545`).

### Step 3: Start the Local Blockchain Node
In a separate terminal:
```bash
cd backend
npm run node:chain
```
This spins up a local EVM node at `http://127.0.0.1:8545`.

### Step 4: Deploy the Smart Contract
```bash
cd backend
npm run deploy:local
```
This compiles `ResearchPaperTracker.sol`, deploys it to the local node, and saves the contract address and ABI to `src/blockchain/deployedContract.json`.

### Step 5: Seed Demo Database
```bash
cd backend
npm run seed
```
Creates conference tracks and pre-configured accounts:
- **Admin**: `admin@conference.edu` / `AdminPassword123!`
- **Reviewer 1**: `prof.smith@university.edu` / `ReviewerPassword123!`
- **Reviewer 2**: `dr.elena@research.org` / `ReviewerPassword123!`
- **Author 1**: `alice.student@university.edu` / `AuthorPassword123!`
- **Author 2**: `bob.student@university.edu` / `AuthorPassword123!`

### Step 6: Start the Backend Server
```bash
cd backend
npm start
# Or for auto-reload during development:
npm run dev
```
The server starts at `http://localhost:5000/api`.

---

## 3. Running Automated Tests

### Smart Contract Unit Tests (Hardhat / Chai)
```bash
npm run test:contracts
```
Verifies contract ownership, sequential version constraints, review registration, duplicate prevention, and public hash verification.

### End-to-End API & Blockchain Integration Tests
```bash
npm test
```
Tests the entire lifecycle through Express HTTP APIs and real blockchain transactions:
1. Health check & blockchain initialization
2. User authentication & JWT issuance (Author, Reviewer, Admin)
3. PDF upload, SHA-256 calculation, and on-chain v1 registration
4. Revision upload and on-chain v2 registration
5. Reviewer assignment & audit logging
6. Double-blind author masking for reviewers
7. Review submission & on-chain integrity hashing
8. Double-blind reviewer masking for authors
9. Editorial decision recording on-chain
10. Public verification (`verify-paper` and `verify-file`)
11. Admin audit trail retrieval

---

## 4. API Endpoints Overview

Detailed API documentation is located in `docs/API_CONTRACT.md`.

- **Auth**:
  - `POST /api/auth/register` - Register user (author, reviewer, admin)
  - `POST /api/auth/login` - Authenticate & receive JWT
  - `GET /api/auth/me` - Current user profile & pseudonym
- **Papers**:
  - `POST /api/papers` - Upload PDF & register on-chain (Author)
  - `GET /api/papers/my-submissions` - View submitted papers (Author)
  - `POST /api/papers/:id/versions` - Submit revised PDF (Author)
  - `GET /api/papers/:id` - Paper details (role-protected, double-blind masked)
  - `GET /api/papers/:id/download` - Download PDF document
- **Reviews**:
  - `GET /api/reviews/assigned` - Assigned papers without author identities (Reviewer)
  - `POST /api/reviews` - Submit evaluation & commit integrity hash (Reviewer)
  - `GET /api/reviews/history` - Reviewer history (Reviewer)
  - `GET /api/reviews/paper/:paperId` - Masked reviewer feedback (Author) / Full (Admin)
- **Admin**:
  - `GET /api/admin/overview` - Conference metrics
  - `GET /api/admin/users` - User directory
  - `GET /api/admin/submissions` - All submissions and review statuses
  - `POST /api/admin/assignments` - Assign reviewer (records on blockchain)
  - `POST /api/admin/decisions` - Record acceptance/rejection (records on blockchain)
  - `GET /api/admin/audit-trail` - Full blockchain audit log
- **Blockchain Verification (Public)**:
  - `POST /api/blockchain/verify-paper` - Verify hash against smart contract
  - `POST /api/blockchain/verify-file` - Upload PDF to verify integrity on-chain
  - `GET /api/blockchain/record/:paperId` - Fetch all on-chain versions & status proofs
