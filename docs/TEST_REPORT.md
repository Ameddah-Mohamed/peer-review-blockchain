# QA Test Report: Research Paper Submission & Peer-Review Tracker

**Date:** November 23, 2026  
**Platform Version:** 1.0.0  
**Test Environment:** macOS (Darwin arm64), Node.js v26.0.0, MongoDB v8.0.3, Hardhat EVM Local Node (Chain ID: 31337), Vite v6.4.6, React 18  
**QA Tester Role:** Lead Quality Assurance & Security Engineer  

---

## Executive Summary & Overall Assessment

### Overall Assessment: **NOT READY FOR DEMONSTRATION** (Requires Immediate Critical Fixes)

While the underlying architecture—specifically the **Solidity smart contract**, the **cryptographic SHA-256 hashing pipeline**, the **MongoDB database models**, and the **backend API endpoints**—functions with high integrity when accessed directly via programmatic HTTP requests, the platform **fails in end-to-end browser usage under standard development setup**.

### Primary Blockers:
1. **Network Interception & Preflight CORS Failure (Critical):** On macOS, the backend's default port (`5000`) is intercepted by macOS Control Center / AirPlay Receiver (`AirTunes/950.7.1`). The frontend defaults to `http://localhost:5000/api`, causing all browser requests to be blocked with preflight CORS `403 Forbidden` errors.
2. **Silent Mock Fallback Masking Blockchain Inactivity (Critical):** Because network calls fail, the frontend silently falls back to an internal in-memory `mockAdapter`. During a live browser demonstration, **zero smart contract transactions are executed on the blockchain**; all activity is simulated client-side.
3. **Critical Security Vulnerabilities:** 
   - **Unrestricted Admin Registration:** Any unauthenticated visitor can register as an `admin` via the public `/api/auth/register` endpoint.
   - **Unauthenticated Demo Token Backdoor:** The authentication middleware accepts `Authorization: Bearer demo_token_admin` without any password or cryptographic signature, granting immediate superuser privileges.
4. **Broken Verification & Manuscript Downloads (High):**
   - The `/verify` page fails with `400 Bad Request` upon PDF upload because it calls the wrong API endpoint without `paperId`.
   - The reviewer manuscript download link points to `/uploads/papers/...`, which returns `404 Not Found` because Vite does not proxy `/uploads`.
5. **Version Display Inversion Bug (High):** The UI accesses `versions[0]` as the latest version, but MongoDB returns versions sorted ascending (v1 first). Revision v2 details and proofs are never displayed as active.

With the 8 targeted fixes outlined in Section 5 of this report, the application can be brought to demonstration readiness within 1–2 hours.

---

## 1. Test Scope & Methodology

Testing was conducted across 10 distinct operational areas, combining automated integration suites, unit contract tests, network traffic inspection, and interactive browser execution:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        QA Verification Scope                           │
├──────────────────────────┬─────────────────────────┬───────────────────┤
│ 1. Setup & Networking    │ 5. Double-Blind Privacy │ 8. Blockchain     │
│ 2. Authentication & RBAC │ 6. Review Submission    │ 9. Frontend UI    │
│ 3. Paper & Versions      │ 7. Final Decisions      │ 10. E2E Lifecyle  │
│ 4. Reviewer Assignment   │                         │                   │
└──────────────────────────┴─────────────────────────┴───────────────────┘
```

- **Smart Contract Verification:** Hardhat local node (`http://127.0.0.1:8545`), contract deployed at `0x5FbDB2315678afecb367f032d93F642f64180aa3`.
- **Backend API Testing:** 35 automated programmatic tests executed against `http://127.0.0.1:5000/api`.
- **Browser User Experience Testing:** Headless browser subagent interacting with `http://localhost:3000` (inspecting DOM, Web Crypto API, console errors, and network preflights).

---

## 2. Detailed Test Results by Category

### Category 1: Application Setup & Inter-Service Communication
| Test Case | Description | Result | Details |
|---|---|---|---|
| **SETUP-01** | Hardhat Local EVM Node | **PASSED** | Hardhat JSON-RPC responding on `127.0.0.1:8545`. Contract code verified. |
| **SETUP-02** | MongoDB Persistence | **PASSED** | Collections created: `users`, `paper`, `paperversions`, `reviewerassignments`, `reviews`, `decisions`, `blockchaintransactions`. |
| **SETUP-03** | Backend Health Endpoint | **PASSED** | `GET /api/health` returns `200 OK`, `blockchainInitialized: true`. |
| **SETUP-04** | Frontend Dev Server | **PASSED** | Vite builds cleanly (`tsc -b && vite build`) and serves UI at `localhost:3000`. |
| **SETUP-05** | Browser-to-Backend Network Binding | **FAILED** | `localhost:5000` intercepted by macOS AirTunes (`Server: AirTunes/950.7.1`, 403 Forbidden). `127.0.0.1:5000` works. |
| **SETUP-06** | Static File Proxying (`/uploads`) | **FAILED** | `frontend/vite.config.ts` proxies `/api`, but omits `/uploads`. Manuscript downloads return `404 Not Found`. |

---

### Category 2: Authentication & Role-Based Access Control (RBAC)
| Test Case | Description | Result | Details |
|---|---|---|---|
| **AUTH-01** | Author Login (`alice.student@university.edu`) | **PASSED** | JWT token issued, pseudonym `AUTH-2DE621` returned. |
| **AUTH-02** | Reviewer 1 Login (`prof.smith@university.edu`) | **PASSED** | JWT token issued, pseudonym `REV-0EBCE8` returned. |
| **AUTH-03** | Reviewer 2 Login (`dr.elena@research.org`) | **PASSED** | JWT token issued, pseudonym `REV-7183D2` returned. |
| **AUTH-04** | Admin Login (`admin@conference.edu`) | **PASSED** | JWT token issued, pseudonym `ADM-342DC4` returned. |
| **AUTH-05** | Login with Invalid Password | **PASSED** | Rejected with `401 Unauthorized` ("Invalid email or password"). |
| **AUTH-06** | Login with Nonexistent Email | **PASSED** | Rejected with `401 Unauthorized` ("Invalid email or password"). |
| **AUTH-07** | Author Registration | **PASSED** | `POST /api/auth/register` creates user with unique pseudonym (`AUTH-XXXXXX`). |
| **AUTH-08** | Duplicate Email Registration | **PASSED** | Rejected with `409 Conflict`. |
| **AUTH-09** | Missing Registration Fields | **PASSED** | Rejected with `400 Bad Request`. |
| **AUTH-10** | RBAC: Author accessing `/api/admin/overview` | **PASSED** | Rejected with `403 Forbidden`. |
| **AUTH-11** | RBAC: Reviewer accessing `/api/admin/overview` | **PASSED** | Rejected with `403 Forbidden`. |
| **AUTH-12** | RBAC: Author accessing `/api/reviews/assigned` | **PASSED** | Rejected with `403 Forbidden`. |
| **AUTH-13** | RBAC: Reviewer submitting paper `/api/papers` | **PASSED** | Rejected with `403 Forbidden`. |
| **AUTH-14** | **Security:** Unrestricted Admin Registration | **FAILED** | **CRITICAL VULNERABILITY:** Public registration accepts `role: "admin"` without authentication. |
| **AUTH-15** | **Security:** Demo Token Backdoor Bypass | **FAILED** | **CRITICAL VULNERABILITY:** `Authorization: Bearer demo_token_admin` grants instant unauthenticated admin rights. |
| **AUTH-16** | Initial Browser Session State | **FAILED** | `AuthContext.tsx` initializes state to `MOCK_USERS[0]` (`Alice Chen`), auto-logging in visitors. |
| **AUTH-17** | Quick-Login Demo Buttons | **FAILED** | `/login` only displays 3 buttons (2 Authors, 1 Reviewer); Admin button is omitted. |

---

### Category 3: Paper Submission & Version Management
| Test Case | Description | Result | Details |
|---|---|---|---|
| **PAPER-01** | Manuscript PDF Upload & Hash Calculation | **PASSED** | Multer saves PDF, `hashService.hashFile` computes SHA-256 matching browser Web Crypto. |
| **PAPER-02** | Initial Version (v1) On-Chain Registration | **PASSED** | Registered in block 40 (`0xe8bdf5c6...`). `currentVersion = 1`, `status = "submitted"`. |
| **PAPER-03** | Submission without PDF | **PASSED** | Rejected with `400 Bad Request` ("PDF document file is required"). |
| **PAPER-04** | Submission with Missing Fields | **PASSED** | Rejected with `400 Bad Request`. |
| **PAPER-05** | Revision Version (v2) Upload | **PASSED** | `POST /api/papers/:id/versions` increments version to 2, computes new SHA-256, logs on-chain in block 41. |
| **PAPER-06** | Non-Author Submitting Revision | **PASSED** | Rejected with `403 Forbidden` ("only the author can submit new revisions"). |
| **PAPER-07** | Document Download via API | **PASSED** | `GET /api/papers/:id/download?version=1` and `?version=2` return exact binary streams. |
| **PAPER-08** | Unauthorized Document Download | **PASSED** | Rejected with `403 Forbidden` for non-author, non-assigned reviewer. |
| **PAPER-09** | Frontend Version Display Indexing | **FAILED** | `AuthorDashboard.tsx:168` and `AdminSubmissionsPage.tsx:157` use `versions[0]` (v1) instead of latest (v2). |

---

### Category 4: Reviewer Management & Assignment
| Test Case | Description | Result | Details |
|---|---|---|---|
| **REV-01** | Admin Assigns Reviewer | **PASSED** | `POST /api/admin/assignments` creates assignment, emits `ReviewerAssigned` on smart contract (block 42). |
| **REV-02** | Automatic Status Update | **PASSED** | Paper status changes from `submitted` to `under_review`. |
| **REV-03** | Conflict of Interest Prevention | **PASSED** | Assigning paper's author as reviewer is rejected with `400 Bad Request`. |
| **REV-04** | Duplicate Assignment Prevention | **PASSED** | Assigning same reviewer twice rejected with `409 Conflict`. |
| **REV-05** | Reviewer Workload Isolation | **PASSED** | Reviewer 1 sees assigned paper in `/api/reviews/assigned`; Reviewer 2 sees empty list. |
| **REV-06** | Assignment Removal | **PASSED** | `DELETE /api/admin/assignments/:id` succeeds if review not yet submitted. |

---

### Category 5: Double-Blind Anonymity Enforcement
| Test Case | Description | Result | Details |
|---|---|---|---|
| **ANON-01** | Reviewer View: Author Identity Shielding | **PASSED** | `/api/reviews/assigned` returns `authorPseudonym` (`AUTH-2DE621`). Author name, email, and ID are `undefined`. |
| **ANON-02** | Reviewer View: Paper Details Shielding | **PASSED** | `GET /api/papers/:id` strips author object for reviewer role. |
| **ANON-03** | Author View: Reviewer Identity Masking | **PASSED** | `GET /api/reviews/paper/:id` masks reviewers as `Reviewer #1`, omitting real name and reviewer pseudonym. |
| **ANON-04** | Confidential Comments Protection | **PASSED** | `confidentialComments` strictly omitted when author views reviews; visible only to admin. |
| **ANON-05** | Admin Global Visibility | **PASSED** | Admin view retains oversight of author identities, reviewer identities, and confidential feedback. |

---

### Category 6: Review Submission & Integrity Verification
| Test Case | Description | Result | Details |
|---|---|---|---|
| **REV-07** | Review Submission (Scores & Feedback) | **PASSED** | Overall score (4.5), 4 criteria scores, recommendation, and comments saved. |
| **REV-08** | Review On-Chain Proof Sealing | **PASSED** | Canonical review hash sealed on-chain via `registerReview` (block 43, `0x99629ba3...`). |
| **REV-09** | Review Immutability Enforcement | **PASSED** | Second review submission for same assignment rejected with `409 Conflict`. |
| **REV-10** | Unassigned Reviewer Submission | **PASSED** | Rejected with `403 Forbidden`. |
| **REV-11** | Author Reviewing Own Paper | **PASSED** | Rejected with `403 Forbidden`. |
| **REV-12** | Review History Retrieval | **PASSED** | `GET /api/reviews/history` returns completed reviews. |
| **REV-13** | Review Hash Schema Alignment | **FAILED** | Frontend computes review hash with local timestamp; backend discards it and computes canonical hash without timestamp. |

---

### Category 7: Final Editorial Decisions
| Test Case | Description | Result | Details |
|---|---|---|---|
| **DEC-01** | Non-Admin Decision Attempt | **PASSED** | Author or reviewer calling `POST /api/admin/decisions` rejected with `403 Forbidden`. |
| **DEC-02** | Admin Acceptance Decision | **PASSED** | Paper status updated to `accepted`. Decision hash sealed on-chain (block 44, `0xf22184f8...`). |
| **DEC-03** | Invalid Decision Status | **PASSED** | Non-standard status strings rejected with `400 Bad Request`. |
| **DEC-04** | Decision Audit Trail | **PASSED** | Emits `DecisionRecorded` event on smart contract; recorded in global audit trail. |

---

### Category 8: Blockchain Smart Contract Verification (Real, Not Simulated)
| Test Case | Description | Result | Details |
|---|---|---|---|
| **BC-01** | Smart Contract Deployment | **PASSED** | Deployer is owner (`0xf39Fd6e5...`), contract active at `0x5FbDB2315...`. |
| **BC-02** | Unit Test Suite Execution | **PASSED** | 13/13 Hardhat tests pass in 314ms. |
| **BC-03** | On-Chain Paper Registration (`getPaper`) | **PASSED** | Returns author pseudonym, version 1, timestamp, `exists: true`. |
| **BC-04** | On-Chain Hash Match (`verifyPaperVersionHash`) | **PASSED** | Returns `matches: true` for valid Version 1 and Version 2 hashes. |
| **BC-05** | Tampered Document Rejection | **PASSED** | Modified SHA-256 hash returns `matches: false`, `HASH_MISMATCH`. |
| **BC-06** | On-Chain Review Proof (`verifyReviewHash`) | **PASSED** | Returns `matches: true` for canonical review hash. |
| **BC-07** | On-Chain Decision Proof (`getDecision`) | **PASSED** | Returns `decisionStatus: "accepted"`, valid `decisionHash`. |
| **BC-08** | Global Immutable Audit Log | **PASSED** | 43 sequential on-chain events retrieved via `getAllAuditEvents()`. |
| **BC-09** | Public API Document File Verification | **PASSED** | `POST /api/blockchain/verify-file` successfully matches uploaded PDF against on-chain record. |
| **BC-10** | Public API Verify Paper Without ID | **FAILED** | `POST /api/blockchain/verify-paper` fails with `400 Bad Request` if `paperId` is omitted. |

---

### Category 9: Frontend User Interface & Browser Automation
| Test Case | Description | Result | Details |
|---|---|---|---|
| **UI-01** | Page Rendering & Styling | **PASSED** | Clean Tailwind typography, responsive layouts, badges, and modals. |
| **UI-02** | In-Browser Cryptographic Hashing | **PASSED** | Web Crypto API computes exact 64-char SHA-256 digest prior to upload. |
| **UI-03** | Author Dashboard Modals | **PASSED** | "Submit Paper", "Version History", and "TxExplorerModal" open and display data. |
| **UI-04** | Reviewer Portal Modals | **PASSED** | Score sliders, recommendation select, and feedback inputs work. |
| **UI-05** | Admin Governance Views | **PASSED** | Submissions filtering, assignment modal, and decision recording functional. |
| **UI-06** | Browser Real-Backend Connectivity | **FAILED** | Browser fails preflight CORS to `localhost:5000` due to AirPlay Receiver interception. |
| **UI-07** | Document Verification Form Integration | **FAILED** | PDF upload in `/verify` triggers 400 Bad Request; UI hangs with no error notice. |
| **UI-08** | PDF File Links | **FAILED** | Clicking "View Manuscript" links to `/uploads/...` which returns 404. |

---

### Category 10: Complete Workflow Simulation
| Test Case | Description | Result | Details |
|---|---|---|---|
| **E2E-01** | Backend / Blockchain Full Lifecycle | **PASSED** | 11/11 lifecycle stages succeed end-to-end with real EVM transactions. |
| **E2E-02** | Browser UI Real Lifecycle | **FAILED** | Works only via simulated in-memory `mockAdapter`; real blockchain is never touched. |

---

## 3. Discovered Bugs & Vulnerabilities

### Severity Breakdown:
- **Critical:** 3
- **High:** 3
- **Medium:** 3
- **Low:** 1

---

### [CRITICAL] BUG-01: macOS AirPlay Receiver Intercepts Port 5000, Breaking Browser API Calls
- **Component:** Backend Configuration / Networking (`backend/.env`, `frontend/.env`)
- **Root Cause:** macOS Monterey, Ventura, Sonoma, and Sequoia run the `AirPlay Receiver` service via `ControlCenter`, binding by default to `*:5000`. When the frontend sends requests to `http://localhost:5000/api/...`, the OS routes `localhost` (`::1`) to AirPlay Receiver (`Server: AirTunes/950.7.1`). AirTunes rejects preflight `OPTIONS` requests with `403 Forbidden` and omits CORS headers (`PreflightMissingAllowOriginHeader`).
- **Impact:** The browser cannot reach the real backend. The frontend catches the error and silently drops into `mockAdapter`. **All blockchain interactions appear to work in the UI, but are 100% simulated in JavaScript memory.**
- **Evidence:**
  ```bash
  $ curl -i http://localhost:5000/api/health
  HTTP/1.1 403 Forbidden
  Server: AirTunes/950.7.1
  ```

---

### [CRITICAL] BUG-02: Public Unrestricted Administrator Account Registration
- **Component:** `backend/src/controllers/authController.js` (lines 51–53)
- **Root Cause:** The public registration endpoint blindly accepts the `role` parameter from the client:
  ```javascript
  let assignedRole = (role || "author").toLowerCase().trim();
  if (assignedRole === "administrator") assignedRole = "admin";
  ```
- **Impact:** Any malicious user or unauthorized student can send `{"role": "admin"}` to `POST /api/auth/register` and obtain a fully privileged Administrator JWT token. They can assign reviewers, alter decision remarks, and view unblinded identities of authors and reviewers.
- **Evidence:** Automated test created account `rogue_admin_...` with role `admin` and executed administrative endpoints successfully.

---

### [CRITICAL] BUG-03: Hardcoded Unauthenticated Demo Token Backdoor in Auth Middleware
- **Component:** `backend/src/middleware/auth.js` (lines 19–35)
- **Root Cause:** The auth middleware explicitly bypasses cryptographic verification for tokens starting with `demo_token_` or `mock_`:
  ```javascript
  if (token.startsWith("demo_token_") || token.startsWith("mock_")) {
    let targetRole = "author";
    if (token.includes("admin") || token.includes("0001")) {
      targetRole = "admin";
    }
    user = await User.findOne({ role: targetRole === "admin" ? { $in: ["admin", "administrator"] } : targetRole });
  }
  ```
- **Impact:** Anyone can bypass authentication completely by sending `Authorization: Bearer demo_token_admin`. The backend matches the database's conference chair account and grants unrestricted admin access without a password.
- **Evidence:** `curl -H "Authorization: Bearer demo_token_admin" http://127.0.0.1:5000/api/admin/overview` returned `200 OK` with full statistics.

---

### [HIGH] BUG-04: Public Document Verification Endpoint Mismatch (`VerifyPaperPage`)
- **Component:** `frontend/src/pages/verify/VerifyPaperPage.tsx` (lines 61–64)
- **Root Cause:** When a user uploads a PDF on the verification page without entering a paper ID, the client hashes the file and calls:
  ```typescript
  blockchainService.verifyPaper(inputPaperId || undefined, calculatedDigest);
  ```
  This calls `POST /api/blockchain/verify-paper` with `{ fileHash: ... }`. The backend strictly enforces:
  ```javascript
  if (!paperId || !fileHash) {
    return res.status(400).json({ success: false, message: "paperId and fileHash are required fields" });
  }
  ```
- **Impact:** File-based verification crashes with `400 Bad Request`. The catch block only logs `console.error`, leaving the UI in a permanent non-responsive state with no error feedback for the user.
- **Note:** The backend *does* implement `POST /api/blockchain/verify-file` (which looks up papers across the entire database by hash alone), but the frontend never calls it.

---

### [HIGH] BUG-05: Missing `/uploads` Proxy in Vite Dev Server Configuration
- **Component:** `frontend/vite.config.ts` (lines 16–21)
- **Root Cause:** The Vite development server proxy is configured exclusively for `/api`:
  ```typescript
  proxy: {
    '/api': { target: 'http://127.0.0.1:5000', changeOrigin: true },
  }
  ```
  Uploaded PDF files are stored on disk and served by the Express backend at `/uploads/...`.
- **Impact:** Clicking "View Manuscript" in the Reviewer Portal (`<a href={asg.fileUrl}>`) navigates to `http://localhost:3000/uploads/papers/...`, resulting in a `404 Not Found` from Vite. Reviewers cannot read uploaded PDFs.

---

### [HIGH] BUG-06: Reverse Version Indexing Displays Stale Version as Latest Active
- **Component:** `frontend/src/pages/author/AuthorDashboard.tsx` (line 168), `frontend/src/pages/admin/AdminSubmissionsPage.tsx` (line 157)
- **Root Cause:** The UI assumes the latest version is at index 0:
  ```typescript
  const latestVersion = paper.versions[0];
  ```
  However, `backend/src/controllers/paperController.js` sorts versions in ascending order:
  ```javascript
  const versions = await PaperVersion.find({ paper: p._id }).sort({ version: 1 });
  ```
- **Impact:** Index 0 is always Version 1 (the initial submission). When an author submits Revision v2, the dashboard continues displaying Version 1's SHA-256 hash, submission date, and transaction proof.

---

### [MEDIUM] BUG-07: Client vs Backend Canonical Review Hash Discrepancy
- **Component:** `frontend/src/components/reviewer/SubmitReviewModal.tsx` (lines 58–68) vs `backend/src/services/hashService.js` (lines 28–44)
- **Root Cause:** The frontend modal hashes a JSON payload including `timestamp: new Date().toISOString()` and `reviewerPseudonym`. The backend ignores `req.body.reviewHash` and recomputes the hash using a deterministic canonical structure without timestamps.
- **Impact:** If any client attempts to verify the review hash it computed against the on-chain recorded hash, the verification will fail.

---

### [MEDIUM] BUG-08: Automatic Login to Mock Author on Fresh Browser Visits
- **Component:** `frontend/src/context/AuthContext.tsx` (lines 30–45)
- **Root Cause:** When `localStorage` is empty, `AuthContext` defaults its state to `MOCK_USERS[0]` (`Alice Chen`) and token to `'mock_jwt_token_initial'`.
- **Impact:** A new visitor navigating to `http://localhost:3000` is immediately authenticated as Alice Chen without ever seeing the landing or login screen.

---

### [MEDIUM] BUG-09: Data Drift: Seed Credentials Do Not Match Frontend Mock Data
- **Component:** `backend/scripts/seed.js` vs `frontend/src/services/mockData.ts`
- **Root Cause:** 
  - Database seed accounts: `alice.student@university.edu`, `prof.smith@university.edu`, `admin@conference.edu`.
  - Frontend mock accounts: `alice.chen@university.edu`, `david.miller@polytech.edu`, `admin@peer-review.org`.
- **Impact:** When the frontend falls back to mock mode, entering the official seed credentials documented in the project `README.md` produces an "Invalid email or password" error.

---

### [LOW] BUG-10: Missing Administrator Button on Quick-Login Bar
- **Component:** `frontend/src/pages/auth/LoginPage.tsx` (line 84)
- **Root Cause:** The login page renders `MOCK_USERS.slice(0, 3)`. Since items 0 and 1 are Authors and item 2 is a Reviewer, the Admin user (item 3) is cut off.
- **Impact:** Evaluators cannot fast-switch to an Administrator account from the login screen and must manually navigate or register.

---

## 4. Missing or Incomplete Functionality

1. **Reviewer Assignment Deadline Management:** The backend model stores a `deadline` field for assignments, but the Admin UI provides no date-picker input when assigning reviewers, defaulting to a fixed timestamp.
2. **Review Scoring Weights:** The smart contract accepts a single `overallScore` (uint8). While the frontend and database collect 4 sub-criteria (Originality, Technical Quality, Clarity, Relevance), there is no weighted aggregate calculation formula configurable by the Conference Chair.
3. **Decentralized Relayer Key Management:** All smart contract calls are submitted by a single centralized backend relayer wallet (`0xf39Fd6e5...`). Authors and reviewers do not sign transactions with their own MetaMask / Web3 wallets. (This is an intentional design choice for double-blind privacy, but should be documented as relayer-mediated).

---

## 5. Recommended Fixes & Remediation Plan

### Step 1: Fix Port Conflict & Enable Vite Proxy (Resolves BUG-01 & BUG-05)
1. In `backend/.env`, set `PORT=5001`.
2. In `frontend/.env`, set `VITE_API_BASE_URL=/api`.
3. In `frontend/vite.config.ts`, update server proxy to include both `/api` and `/uploads`:
   ```typescript
   server: {
     host: '127.0.0.1',
     port: 3000,
     proxy: {
       '/api': {
         target: 'http://127.0.0.1:5001',
         changeOrigin: true,
       },
       '/uploads': {
         target: 'http://127.0.0.1:5001',
         changeOrigin: true,
       },
     },
   }
   ```

### Step 2: Remove Security Backdoors (Resolves BUG-02 & BUG-03)
1. In `backend/src/controllers/authController.js`, remove admin self-registration:
   ```javascript
   // Force all public registrations to author; reviewers/admins require invitation
   const assignedRole = "author";
   ```
2. In `backend/src/middleware/auth.js`, delete lines 19–35 (the `demo_token_` unauthenticated bypass block). Enforce strict `jwt.verify()` on all tokens.

### Step 3: Align Public Verification API (Resolves BUG-04)
1. In `frontend/src/services/blockchainService.ts`, add:
   ```typescript
   async verifyFile(file: File): Promise<VerificationResult> {
     const formData = new FormData();
     formData.append('file', file);
     const res = await apiClient.post<any>('/blockchain/verify-file', formData, true);
     return res;
   }
   ```
2. In `frontend/src/pages/verify/VerifyPaperPage.tsx`, update `handleFileUpload` to call `blockchainService.verifyFile(selectedFile)`.

### Step 4: Fix Latest Version Indexing (Resolves BUG-06)
In `AuthorDashboard.tsx` and `AdminSubmissionsPage.tsx`, retrieve the active version correctly:
```typescript
const latestVersion = paper.versions[paper.versions.length - 1];
```

### Step 5: Fix Default Session Initialization (Resolves BUG-08 & BUG-10)
In `frontend/src/context/AuthContext.tsx`, change initial state to `null`:
```typescript
const [user, setUser] = useState<User | null>(() => {
  const saved = localStorage.getItem(USER_KEY);
  return saved ? JSON.parse(saved) : null;
});
const [token, setToken] = useState<string | null>(() => {
  return localStorage.getItem(TOKEN_KEY) || null;
});
```
In `LoginPage.tsx`, map quick demo buttons by role to guarantee an Admin button appears:
```typescript
const demoRoles: UserRole[] = ['author', 'reviewer', 'admin'];
```

---

## 6. Verification Summary Checklist

| Objective | Target | Status |
|---|---|---|
| Application Setup | Backend, Frontend, MongoDB, Hardhat start | **PASSED** (Requires port change to 5001) |
| Authentication | Login, Register, Roles (Author, Reviewer, Admin) | **PASSED** (Vulnerabilities must be patched) |
| Paper Submission | PDF Upload, SHA-256 hash, v1 & v2 versions | **PASSED** |
| Reviewer Management | Assignment, isolation, conflict of interest check | **PASSED** |
| Double-Blind Privacy | Reviewers cannot see authors; Authors cannot see reviewers | **PASSED** |
| Review Submission | Form, scores, comments, on-chain hash commitment | **PASSED** |
| Final Decisions | Acceptance/rejection restricted to Admin | **PASSED** |
| Blockchain Integrity | Real EVM transactions, timestamps, hash matching | **PASSED** (Confirmed in blocks 40–44) |
| Frontend Usability | Navigation, UI components, Modals | **PASSED** (Requires API proxy alignment) |
| Live Demonstration | Ready for presentation to audience | **NOT READY** (Follow Remediation Plan) |

---
*Report compiled and certified by Quality Assurance Engineering.*
