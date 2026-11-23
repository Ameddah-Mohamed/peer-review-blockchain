# Project: Research Paper Submission & Peer-Review Tracker

## 1. Project Overview

We are developing a blockchain-based research paper submission and peer-review management platform for a student conference or academic journal.

The goal is to manage the complete research paper lifecycle, from submission to final acceptance or rejection, while using blockchain to provide tamper-evident records, timestamped proofs of existence, and pseudonymous identities.

Traditional centralized platforms rely entirely on administrators and databases. An administrator could potentially modify submission dates, replace papers, delete reviews, or alter decisions.

Our application addresses these trust issues by recording important events on an immutable blockchain ledger.

## 2. User Roles

There are three main roles:

### Author (Student)
- Register and log in.
- Upload research papers in PDF format.
- Submit new paper versions.
- View submission history and timestamps.
- Verify the integrity of submitted papers.
- Track review status.
- Receive acceptance or rejection decisions.

### Reviewer (Professor)
- Log in.
- View papers assigned to them.
- Access papers without seeing author identities.
- Submit scores and written feedback.
- Track their submitted reviews.

### Administrator (Conference Organizer)
- Manage users and conference settings.
- Manage paper submissions.
- Assign reviewers to papers.
- Monitor review progress.
- Make final acceptance/rejection decisions.
- View the audit history.

## 3. Main Features

### A. Paper Registration
- Upload PDF documents.
- Calculate a SHA-256 hash for each paper version.
- Store the PDF off-chain.
- Register the paper hash, pseudonymous author ID, paper ID, version and timestamp on blockchain.
- Preserve the history of all versions.

### B. Double-Blind Peer Review
- Authors must not see reviewer identities.
- Reviewers must not see author identities.
- Use pseudonymous identifiers.
- Enforce role-based permissions in the backend.
- Protect the mapping between real identities and pseudonymous IDs.

### C. Reviewer Assignment
- Administrators assign reviewers to papers.
- Record relevant assignment events.
- Prevent unauthorized access to assignments.
- Do not expose confidential identity mappings publicly.

### D. Review Submission
- Reviewers submit scores and comments.
- Store the actual review off-chain.
- Calculate a hash of the review.
- Register its integrity proof and timestamp on blockchain.
- Prevent unauthorized review modifications.

### E. Final Decisions
- Administrators record the final acceptance or rejection decision.
- Record the decision and timestamp on blockchain.
- Preserve the historical decision record.

### F. Blockchain Verification
Users should be able to verify:
- Whether a paper matches its originally registered hash.
- Whether a specific paper version was registered.
- The blockchain registration timestamp.
- Whether a review or decision matches its registered integrity proof.

## 4. Architecture

Use a hybrid architecture:

- React frontend.
- Node.js and Express backend.
- MongoDB database.
- Solidity smart contracts.
- Hardhat development environment.
- ethers.js for blockchain interaction.
- Off-chain PDF storage.

The backend handles authentication, authorization, business logic, file uploads and database operations.

The smart contract handles blockchain registration and verification of important events.

The frontend communicates with the backend through REST APIs.

## 5. Important Blockchain Principles

- Never store actual PDFs or confidential review content directly on a public blockchain.
- Never store passwords, emails or real user identities on-chain.
- Use pseudonymous IDs in blockchain transactions.
- Use smart contracts to enforce important on-chain rules.
- Preserve historical versions and records.
- Blockchain transactions must be verifiable.
- Never claim that a blockchain transaction succeeded before receiving confirmation.
- Blockchain timestamps represent transaction recording time, not necessarily the exact moment the user clicked Submit.

## 6. Development Expectations

This is an academic project. We want to understand and demonstrate the actual blockchain concepts, not simply build a traditional CRUD application.

Prioritize:
1. Correct functionality.
2. Security and access control.
3. Meaningful blockchain integration.
4. Clean architecture.
5. Maintainable code.
6. A professional user interface.

Do not invent features that are unrelated to the project.

Before implementing anything, inspect the existing repository, understand its structure, and propose an implementation plan.

Do not overwrite existing code or introduce unnecessary dependencies without explaining why.

Document important architectural decisions and explain how each blockchain interaction works.