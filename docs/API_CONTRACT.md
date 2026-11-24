# Research Paper Submission & Peer-Review Tracker: Shared API Contract

## 1. Overview & Architecture
This document defines the REST API contract between the Frontend (React + TypeScript) and the Backend (Node.js/Express + MongoDB + Hardhat/Ethereum).

- **Base URL**: Set via environment variable `VITE_API_BASE_URL` (default: `/api` or `http://localhost:5001/api`)
- **Authentication**: Bearer Token in `Authorization` header (`Bearer <jwt_token>`)
- **Data Format**: `application/json` (except file uploads which use `multipart/form-data`)
- **Double-Blind Integrity**: Author identities MUST NEVER be exposed in Reviewer endpoints. Reviewers only see `paperId`, `title`, `abstract`, `track`, `pseudonymId`.

---

## 2. Authentication & User Management

### `POST /auth/register`
**Request Body**:
```json
{
  "name": "Jane Doe",
  "email": "jane@university.edu",
  "password": "SecurePassword123!",
  "role": "author" // "author" | "reviewer" | "admin"
}
```
**Response (201 Created)**:
```json
{
  "success": true,
  "message": "User registered successfully",
  "token": "eyJhbGciOi...",
  "user": {
    "id": "usr_6789",
    "name": "Jane Doe",
    "email": "jane@university.edu",
    "role": "author",
    "pseudonymId": "AUTH-7F3A29"
  }
}
```

### `POST /auth/login`
**Request Body**:
```json
{
  "email": "jane@university.edu",
  "password": "SecurePassword123!"
}
```
**Response (200 OK)**:
```json
{
  "success": true,
  "token": "eyJhbGciOi...",
  "user": {
    "id": "usr_6789",
    "name": "Jane Doe",
    "email": "jane@university.edu",
    "role": "author",
    "pseudonymId": "AUTH-7F3A29"
  }
}
```

### `GET /auth/me`
**Headers**: `Authorization: Bearer <token>`
**Response (200 OK)**:
```json
{
  "success": true,
  "user": {
    "id": "usr_6789",
    "name": "Jane Doe",
    "email": "jane@university.edu",
    "role": "author",
    "pseudonymId": "AUTH-7F3A29"
  }
}
```

---

## 3. Paper Management (Author & Common)

### `GET /papers/my-submissions` (Author only)
Returns all papers submitted by the authenticated author.
**Response (200 OK)**:
```json
{
  "success": true,
  "papers": [
    {
      "id": "paper_101",
      "title": "Scalable Consensus Algorithms for Distributed Ledgers",
      "abstract": "This paper presents a formal analysis...",
      "track": "Blockchain Architecture",
      "keywords": ["consensus", "byzantine", "scalability"],
      "status": "under_review", // "submitted" | "under_review" | "revision_requested" | "accepted" | "rejected"
      "currentVersion": 2,
      "versions": [
        {
          "version": 1,
          "fileHash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
          "fileUrl": "/uploads/papers/paper_101_v1.pdf",
          "submittedAt": "2026-11-20T10:00:00.000Z",
          "blockchainTxHash": "0x4a8f9...",
          "blockNumber": 124501,
          "verified": true
        },
        {
          "version": 2,
          "fileHash": "89d71b5634563a9254...",
          "fileUrl": "/uploads/papers/paper_101_v2.pdf",
          "submittedAt": "2026-11-22T14:30:00.000Z",
          "blockchainTxHash": "0x98f2b...",
          "blockNumber": 124800,
          "verified": true
        }
      ],
      "decision": null, // or { "status": "accepted", "remarks": "Excellent paper", "decidedAt": "...", "blockchainTxHash": "0x..." }
      "reviews": [] // Author does not see reviewer names, only sanitized feedback if decision published
    }
  ]
}
```

### `POST /papers` (Author only)
Uploads a new paper. Content-Type: `multipart/form-data`.
**Form Fields**:
- `title`: string
- `abstract`: string
- `track`: string
- `keywords`: comma-separated string or array
- `file`: PDF file blob
**Response (201 Created)**:
```json
{
  "success": true,
  "message": "Paper submitted and registered on blockchain",
  "paper": {
    "id": "paper_102",
    "title": "Zero-Knowledge Rollups for Privacy-Preserving Voting",
    "status": "submitted",
    "currentVersion": 1,
    "fileHash": "6b86b273ff34fce19d6b804eff5a3f5747ada4eaa22f1d49c01e52ddb7875b4b",
    "blockchainTxHash": "0x7c81a...",
    "blockNumber": 125100,
    "submittedAt": "2026-11-23T18:00:00.000Z"
  }
}
```

### `POST /papers/:id/versions` (Author only)
Submits a revised version of an existing paper.
**Form Fields**:
- `file`: PDF file blob
- `changeLog`: string
**Response (201 Created)**: Returns updated paper with new version registered on-chain.

### `GET /papers/:id` (Role-authorized)
Fetches paper details. If requested by reviewer, author identity is stripped.

---

## 4. Reviewer Endpoints (Double-Blind)

### `GET /reviews/assigned` (Reviewer only)
Returns papers assigned to the authenticated reviewer. NEVER includes real author details.
**Response (200 OK)**:
```json
{
  "success": true,
  "assignments": [
    {
      "id": "assign_501",
      "paperId": "paper_101",
      "title": "Scalable Consensus Algorithms for Distributed Ledgers",
      "abstract": "This paper presents a formal analysis...",
      "track": "Blockchain Architecture",
      "keywords": ["consensus", "byzantine"],
      "authorPseudonym": "AUTH-7F3A29",
      "currentVersion": 2,
      "fileUrl": "/uploads/papers/paper_101_v2.pdf",
      "fileHash": "89d71b5634563a9254...",
      "assignedAt": "2026-11-21T09:00:00.000Z",
      "deadline": "2026-12-05T23:59:59.000Z",
      "reviewStatus": "pending", // "pending" | "submitted"
      "review": null // or review details if submitted
    }
  ]
}
```

### `POST /reviews` (Reviewer only)
Submit score and evaluation for an assigned paper.
**Request Body**:
```json
{
  "assignmentId": "assign_501",
  "paperId": "paper_101",
  "scores": {
    "originality": 4,      // 1-5
    "technicalQuality": 5, // 1-5
    "clarity": 4,          // 1-5
    "relevance": 5         // 1-5
  },
  "overallScore": 4.5,
  "recommendation": "accept", // "strong_accept" | "accept" | "borderline" | "reject" | "strong_reject"
  "authorComments": "The methodology is rigorous. Suggestions: clarify equation 3.",
  "confidentialComments": "The author has strong results. Recommended for spotlight."
}
```
**Response (201 Created)**:
```json
{
  "success": true,
  "message": "Review submitted and hash recorded on blockchain",
  "review": {
    "id": "rev_301",
    "paperId": "paper_101",
    "reviewHash": "3f79e8a8b2...",
    "blockchainTxHash": "0x19ad3...",
    "blockNumber": 125240,
    "submittedAt": "2026-11-23T18:15:00.000Z"
  }
}
```

### `GET /reviews/history` (Reviewer only)
Returns past reviews submitted by this reviewer with integrity proofs and timestamps.

---

## 5. Administrator Endpoints

### `GET /admin/overview` (Admin only)
Conference statistics and summary.
**Response (200 OK)**:
```json
{
  "success": true,
  "stats": {
    "totalPapers": 42,
    "submitted": 12,
    "underReview": 20,
    "accepted": 8,
    "rejected": 2,
    "totalReviewers": 15,
    "totalReviewsExpected": 60,
    "totalReviewsCompleted": 45,
    "blockchainEventsCount": 182
  }
}
```

### `GET /admin/users` (Admin only)
Lists all users with roles, emails, and pseudonyms. Can filter by role.

### `PATCH /admin/users/:id/role` (Admin only)
Update user role (e.g. promote author to reviewer or organizer).

### `GET /admin/submissions` (Admin only)
Lists all conference submissions with full details, assigned reviewers, review scores, and current status.

### `POST /admin/assignments` (Admin only)
Assigns a reviewer to a paper.
**Request Body**:
```json
{
  "paperId": "paper_101",
  "reviewerId": "usr_902"
}
```
**Response (201 Created)**:
```json
{
  "success": true,
  "message": "Reviewer assigned successfully",
  "assignment": { "id": "assign_502", "paperId": "paper_101", "reviewerId": "usr_902" }
}
```

### `DELETE /admin/assignments/:assignmentId` (Admin only)
Removes reviewer assignment.

### `POST /admin/decisions` (Admin only)
Records final conference decision. Registered immutably on blockchain.
**Request Body**:
```json
{
  "paperId": "paper_101",
  "decision": "accepted", // "accepted" | "rejected" | "revision_requested"
  "remarks": "Accepted based on strong positive peer reviews."
}
```
**Response (200 OK)**:
```json
{
  "success": true,
  "message": "Decision recorded on blockchain",
  "decision": {
    "paperId": "paper_101",
    "status": "accepted",
    "blockchainTxHash": "0x54e21...",
    "blockNumber": 125310,
    "decidedAt": "2026-11-23T18:20:00.000Z"
  }
}
```

### `GET /admin/audit-trail` (Admin only)
Complete audit log of all events registered on blockchain.
**Response (200 OK)**:
```json
{
  "success": true,
  "events": [
    {
      "id": "evt_1",
      "eventType": "PaperRegistered", // "PaperRegistered" | "ReviewerAssigned" | "ReviewSubmitted" | "DecisionRecorded"
      "paperId": "paper_101",
      "version": 1,
      "actorPseudonym": "AUTH-7F3A29",
      "dataHash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      "txHash": "0x4a8f9...",
      "blockNumber": 124501,
      "timestamp": "2026-11-20T10:00:00.000Z"
    }
  ]
}
```

---

## 6. Blockchain Verification Endpoints (Public/Any Authenticated User)

### `POST /blockchain/verify-paper`
Verifies a calculated or uploaded file hash against the smart contract record.
**Request Body**:
```json
{
  "paperId": "paper_101",
  "fileHash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "version": 1
}
```
**Response (200 OK)**:
```json
{
  "success": true,
  "verified": true,
  "matchStatus": "MATCH_CONFIRMED", // "MATCH_CONFIRMED" | "HASH_MISMATCH" | "RECORD_NOT_FOUND"
  "blockchainRecord": {
    "paperId": "paper_101",
    "version": 1,
    "onChainHash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    "authorPseudonym": "AUTH-7F3A29",
    "blockNumber": 124501,
    "blockTimestamp": "2026-11-20T10:00:15.000Z",
    "txHash": "0x4a8f9..."
  }
}
```

### `GET /blockchain/record/:paperId`
Retrieves all on-chain registered versions and status proofs for a paper.
