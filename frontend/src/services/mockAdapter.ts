import {
  User,
  Paper,
  ReviewAssignment,
  ConferenceStats,
  BlockchainEvent,
  VerificationResult,
} from '../types';
import {
  MOCK_USERS,
  MOCK_PAPERS,
  MOCK_ASSIGNMENTS,
  MOCK_STATS,
  MOCK_AUDIT_EVENTS,
} from './mockData';

// In-memory state for isolated testing and fallback
let papersStore: Paper[] = JSON.parse(JSON.stringify(MOCK_PAPERS));
let assignmentsStore: ReviewAssignment[] = JSON.parse(JSON.stringify(MOCK_ASSIGNMENTS));
let usersStore: User[] = JSON.parse(JSON.stringify(MOCK_USERS));
let auditEventsStore: BlockchainEvent[] = JSON.parse(JSON.stringify(MOCK_AUDIT_EVENTS));
let currentBlock = 155400;

export const mockAdapter = {
  // Auth
  async login(email: string, _pass: string): Promise<{ token: string; user: User }> {
    await new Promise((r) => setTimeout(r, 400));
    const user = usersStore.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      throw new Error('Invalid email or password');
    }
    return {
      token: `mock_jwt_token_${user.id}_${Date.now()}`,
      user,
    };
  },

  async register(data: { name: string; email: string; role: any; affiliation?: string }): Promise<{ token: string; user: User }> {
    await new Promise((r) => setTimeout(r, 500));
    const existing = usersStore.find((u) => u.email.toLowerCase() === data.email.toLowerCase());
    if (existing) {
      throw new Error('User with this email already exists');
    }

    const id = `usr_${Date.now()}`;
    const prefix = data.role === 'author' ? 'AUTH' : data.role === 'reviewer' ? 'REV' : 'ADM';
    const randHex = Math.random().toString(16).substring(2, 8).toUpperCase();
    const newUser: User = {
      id,
      name: data.name,
      email: data.email,
      role: data.role,
      pseudonymId: `${prefix}-${randHex}`,
      affiliation: data.affiliation || 'Academic Institution',
      createdAt: new Date().toISOString(),
    };

    usersStore.push(newUser);
    return {
      token: `mock_jwt_token_${newUser.id}_${Date.now()}`,
      user: newUser,
    };
  },

  async getCurrentUser(token: string): Promise<User> {
    await new Promise((r) => setTimeout(r, 200));
    const match = usersStore.find((u) => token.includes(u.id));
    if (match) return match;
    // Default fallback to first author if unrecognized token
    return usersStore[0];
  },

  // Author: Papers
  async getMySubmissions(userId: string): Promise<Paper[]> {
    await new Promise((r) => setTimeout(r, 300));
    return papersStore.filter((p) => p.authorId === userId);
  },

  async getPaperById(paperId: string): Promise<Paper> {
    await new Promise((r) => setTimeout(r, 250));
    const paper = papersStore.find((p) => p.id === paperId);
    if (!paper) throw new Error('Paper not found');
    return paper;
  },

  async submitPaper(data: {
    title: string;
    abstract: string;
    track: string;
    keywords: string[];
    fileHash: string;
    fileName: string;
    fileSize: number;
    user: User;
  }): Promise<Paper> {
    await new Promise((r) => setTimeout(r, 700));
    currentBlock += 1;
    const paperId = `paper_${Date.now().toString().slice(-4)}`;
    const txHash = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;

    const newPaper: Paper = {
      id: paperId,
      title: data.title,
      abstract: data.abstract,
      track: data.track,
      keywords: data.keywords,
      status: 'submitted',
      authorId: data.user.id,
      authorName: data.user.name,
      authorPseudonym: data.user.pseudonymId,
      currentVersion: 1,
      versions: [
        {
          version: 1,
          fileHash: data.fileHash,
          fileUrl: URL.createObjectURL(new Blob(['Mock PDF Content'], { type: 'application/pdf' })),
          fileName: data.fileName,
          fileSize: data.fileSize,
          changeLog: 'Initial conference submission.',
          submittedAt: new Date().toISOString(),
          blockchainTxHash: txHash,
          blockNumber: currentBlock,
          verified: true,
        },
      ],
      assignedReviewerCount: 0,
      completedReviewCount: 0,
      reviews: [],
      decision: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    papersStore.unshift(newPaper);

    // Record on mock audit ledger
    auditEventsStore.unshift({
      id: `evt_${Date.now()}`,
      eventType: 'PaperRegistered',
      paperId,
      version: 1,
      actorPseudonym: data.user.pseudonymId,
      dataHash: data.fileHash,
      txHash,
      blockNumber: currentBlock,
      timestamp: new Date().toISOString(),
      details: { title: data.title, version: 1 },
    });

    return newPaper;
  },

  async submitNewVersion(paperId: string, data: {
    fileHash: string;
    fileName: string;
    fileSize: number;
    changeLog: string;
    user: User;
  }): Promise<Paper> {
    await new Promise((r) => setTimeout(r, 600));
    const paper = papersStore.find((p) => p.id === paperId);
    if (!paper) throw new Error('Paper not found');

    currentBlock += 1;
    const nextVer = paper.currentVersion + 1;
    const txHash = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;

    paper.currentVersion = nextVer;
    paper.versions.unshift({
      version: nextVer,
      fileHash: data.fileHash,
      fileUrl: URL.createObjectURL(new Blob(['Mock Revised PDF'], { type: 'application/pdf' })),
      fileName: data.fileName,
      fileSize: data.fileSize,
      changeLog: data.changeLog,
      submittedAt: new Date().toISOString(),
      blockchainTxHash: txHash,
      blockNumber: currentBlock,
      verified: true,
    });
    paper.updatedAt = new Date().toISOString();

    // Audit event
    auditEventsStore.unshift({
      id: `evt_${Date.now()}`,
      eventType: 'PaperRegistered',
      paperId,
      version: nextVer,
      actorPseudonym: data.user.pseudonymId,
      dataHash: data.fileHash,
      txHash,
      blockNumber: currentBlock,
      timestamp: new Date().toISOString(),
      details: { version: nextVer, changeLog: data.changeLog },
    });

    return paper;
  },

  // Reviewer Endpoints (Double-Blind)
  async getAssignedReviews(reviewerId: string): Promise<ReviewAssignment[]> {
    await new Promise((r) => setTimeout(r, 300));
    return assignmentsStore.filter((a) => a.reviewerId === reviewerId);
  },

  async submitReview(data: {
    assignmentId: string;
    paperId: string;
    scores: any;
    overallScore: number;
    recommendation: any;
    authorComments: string;
    confidentialComments?: string;
    reviewHash: string;
    reviewer: User;
  }) {
    await new Promise((r) => setTimeout(r, 650));
    currentBlock += 1;
    const txHash = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
    const reviewId = `rev_${Date.now()}`;

    const newReview = {
      id: reviewId,
      assignmentId: data.assignmentId,
      paperId: data.paperId,
      reviewerPseudonym: data.reviewer.pseudonymId,
      scores: data.scores,
      overallScore: data.overallScore,
      recommendation: data.recommendation,
      authorComments: data.authorComments,
      confidentialComments: data.confidentialComments,
      reviewHash: data.reviewHash,
      blockchainTxHash: txHash,
      blockNumber: currentBlock,
      submittedAt: new Date().toISOString(),
      verified: true,
    };

    // Update assignment
    const assignment = assignmentsStore.find((a) => a.id === data.assignmentId);
    if (assignment) {
      assignment.reviewStatus = 'submitted';
      assignment.review = newReview;
    }

    // Update paper
    const paper = papersStore.find((p) => p.id === data.paperId);
    if (paper) {
      if (!paper.reviews) paper.reviews = [];
      paper.reviews.push(newReview);
      paper.completedReviewCount = (paper.completedReviewCount || 0) + 1;
      if (paper.status === 'submitted') {
        paper.status = 'under_review';
      }
    }

    // Record on blockchain audit
    auditEventsStore.unshift({
      id: `evt_${Date.now()}`,
      eventType: 'ReviewSubmitted',
      paperId: data.paperId,
      actorPseudonym: data.reviewer.pseudonymId,
      dataHash: data.reviewHash,
      txHash,
      blockNumber: currentBlock,
      timestamp: new Date().toISOString(),
      details: { recommendation: data.recommendation, overallScore: data.overallScore },
    });

    return newReview;
  },

  // Admin Endpoints
  async getAdminStats(): Promise<ConferenceStats> {
    await new Promise((r) => setTimeout(r, 300));
    return {
      ...MOCK_STATS,
      totalPapers: papersStore.length,
      submitted: papersStore.filter((p) => p.status === 'submitted').length,
      underReview: papersStore.filter((p) => p.status === 'under_review').length,
      accepted: papersStore.filter((p) => p.status === 'accepted').length,
      rejected: papersStore.filter((p) => p.status === 'rejected').length,
      revisionRequested: papersStore.filter((p) => p.status === 'revision_requested').length,
      totalAuthors: usersStore.filter((u) => u.role === 'author').length,
      totalReviewers: usersStore.filter((u) => u.role === 'reviewer').length,
      blockchainEventsCount: auditEventsStore.length,
      latestBlockNumber: currentBlock,
    };
  },

  async getAllSubmissions(): Promise<Paper[]> {
    await new Promise((r) => setTimeout(r, 350));
    return papersStore;
  },

  async getAllUsers(): Promise<User[]> {
    await new Promise((r) => setTimeout(r, 250));
    return usersStore;
  },

  async updateUserRole(userId: string, newRole: any): Promise<User> {
    await new Promise((r) => setTimeout(r, 300));
    const user = usersStore.find((u) => u.id === userId);
    if (!user) throw new Error('User not found');
    user.role = newRole;
    return user;
  },

  async assignReviewer(paperId: string, reviewerId: string, adminUser: User): Promise<ReviewAssignment> {
    await new Promise((r) => setTimeout(r, 500));
    const paper = papersStore.find((p) => p.id === paperId);
    const reviewer = usersStore.find((u) => u.id === reviewerId);
    if (!paper || !reviewer) throw new Error('Paper or Reviewer not found');

    const latestVer = paper.versions[0];
    currentBlock += 1;
    const txHash = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;

    const newAssignment: ReviewAssignment = {
      id: `asg_${Date.now()}`,
      paperId: paper.id,
      reviewerId: reviewer.id,
      reviewerPseudonym: reviewer.pseudonymId,
      reviewerName: reviewer.name,
      title: paper.title,
      abstract: paper.abstract,
      track: paper.track,
      keywords: paper.keywords,
      authorPseudonym: paper.authorPseudonym,
      currentVersion: paper.currentVersion,
      fileUrl: latestVer ? latestVer.fileUrl : '',
      fileHash: latestVer ? latestVer.fileHash : '',
      assignedAt: new Date().toISOString(),
      deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      reviewStatus: 'pending',
      review: null,
    };

    assignmentsStore.push(newAssignment);
    paper.assignedReviewerCount = (paper.assignedReviewerCount || 0) + 1;
    if (paper.status === 'submitted') {
      paper.status = 'under_review';
    }

    auditEventsStore.unshift({
      id: `evt_${Date.now()}`,
      eventType: 'ReviewerAssigned',
      paperId: paper.id,
      actorPseudonym: adminUser.pseudonymId,
      dataHash: `0x${Math.random().toString(16).substring(2)}`,
      txHash,
      blockNumber: currentBlock,
      timestamp: new Date().toISOString(),
      details: { reviewerPseudonym: reviewer.pseudonymId },
    });

    return newAssignment;
  },

  async makeDecision(paperId: string, decision: 'accepted' | 'rejected' | 'revision_requested', remarks: string, adminUser: User): Promise<Paper> {
    await new Promise((r) => setTimeout(r, 600));
    const paper = papersStore.find((p) => p.id === paperId);
    if (!paper) throw new Error('Paper not found');

    currentBlock += 1;
    const txHash = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;

    paper.status = decision;
    paper.decision = {
      status: decision,
      remarks,
      decidedAt: new Date().toISOString(),
      decidedByPseudonym: adminUser.pseudonymId,
      blockchainTxHash: txHash,
      blockNumber: currentBlock,
    };

    auditEventsStore.unshift({
      id: `evt_${Date.now()}`,
      eventType: 'DecisionRecorded',
      paperId: paper.id,
      actorPseudonym: adminUser.pseudonymId,
      dataHash: `0x${Math.random().toString(16).substring(2)}`,
      txHash,
      blockNumber: currentBlock,
      timestamp: new Date().toISOString(),
      details: { decision, remarks },
    });

    return paper;
  },

  async getAuditTrail(): Promise<BlockchainEvent[]> {
    await new Promise((r) => setTimeout(r, 300));
    return auditEventsStore;
  },

  // Public Blockchain Verification
  async verifyPaper(paperId?: string, fileHash?: string, versionNumber?: number): Promise<VerificationResult> {
    await new Promise((r) => setTimeout(r, 600));

    if (!fileHash) {
      return {
        verified: false,
        matchStatus: 'RECORD_NOT_FOUND',
        calculatedHash: '',
        message: 'No file hash provided for verification.',
      };
    }

    const cleanHash = fileHash.toLowerCase().trim();

    // Look for matching version in papersStore
    for (const paper of papersStore) {
      if (paperId && paper.id !== paperId) continue;

      for (const ver of paper.versions) {
        if (versionNumber !== undefined && ver.version !== versionNumber) continue;

        if (ver.fileHash.toLowerCase() === cleanHash) {
          return {
            verified: true,
            matchStatus: 'MATCH_CONFIRMED',
            calculatedHash: cleanHash,
            blockchainRecord: {
              paperId: paper.id,
              version: ver.version,
              onChainHash: ver.fileHash,
              authorPseudonym: paper.authorPseudonym,
              blockNumber: ver.blockNumber,
              blockTimestamp: ver.submittedAt,
              txHash: ver.blockchainTxHash,
            },
            message: `Cryptographic SHA-256 hash perfectly matches Paper ${paper.id} (Version ${ver.version}) registered in Block #${ver.blockNumber}.`,
          };
        }
      }
    }

    // If paperId was given but hash didn't match
    if (paperId) {
      const paper = papersStore.find((p) => p.id === paperId);
      if (paper && paper.versions.length > 0) {
        const targetVer = versionNumber ? paper.versions.find((v) => v.version === versionNumber) : paper.versions[0];
        if (targetVer) {
          return {
            verified: false,
            matchStatus: 'HASH_MISMATCH',
            calculatedHash: cleanHash,
            blockchainRecord: {
              paperId: paper.id,
              version: targetVer.version,
              onChainHash: targetVer.fileHash,
              authorPseudonym: paper.authorPseudonym,
              blockNumber: targetVer.blockNumber,
              blockTimestamp: targetVer.submittedAt,
              txHash: targetVer.blockchainTxHash,
            },
            message: 'INTEGRITY ALERT: The computed document hash does NOT match the immutable hash registered on the blockchain.',
          };
        }
      }
    }

    return {
      verified: false,
      matchStatus: 'RECORD_NOT_FOUND',
      calculatedHash: cleanHash,
      message: 'No matching research paper hash found on the blockchain ledger.',
    };
  },
};
