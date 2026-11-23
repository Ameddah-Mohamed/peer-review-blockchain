export type UserRole = 'author' | 'reviewer' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  pseudonymId: string; // e.g. "AUTH-9F4B12" or "REV-8C2190"
  affiliation?: string;
  createdAt?: string;
}

export type PaperStatus =
  | 'submitted'
  | 'under_review'
  | 'revision_requested'
  | 'accepted'
  | 'rejected';

export interface PaperVersion {
  version: number;
  fileHash: string; // SHA-256 hash of PDF
  fileUrl: string;
  fileName?: string;
  fileSize?: number;
  changeLog?: string;
  submittedAt: string;
  blockchainTxHash: string;
  blockNumber: number;
  verified: boolean;
}

export interface ReviewScore {
  originality: number; // 1-5
  technicalQuality: number; // 1-5
  clarity: number; // 1-5
  relevance: number; // 1-5
}

export type Recommendation =
  | 'strong_accept'
  | 'accept'
  | 'borderline'
  | 'reject'
  | 'strong_reject';

export interface Review {
  id: string;
  assignmentId?: string;
  paperId: string;
  reviewerPseudonym: string; // Reviewers never show real names
  scores: ReviewScore;
  overallScore: number;
  recommendation: Recommendation;
  authorComments: string;
  confidentialComments?: string; // Only visible to admin/organizer
  reviewHash: string;
  blockchainTxHash: string;
  blockNumber: number;
  submittedAt: string;
  verified: boolean;
}

export interface PaperDecision {
  status: 'accepted' | 'rejected' | 'revision_requested';
  remarks: string;
  decidedAt: string;
  decidedByPseudonym?: string;
  blockchainTxHash: string;
  blockNumber: number;
}

export interface Paper {
  id: string;
  title: string;
  abstract: string;
  track: string;
  keywords: string[];
  status: PaperStatus;
  authorId?: string; // Present in Author/Admin view, strictly omitted in Reviewer view
  authorName?: string; // Strictly omitted in Reviewer view
  authorPseudonym: string; // Visible to everyone
  currentVersion: number;
  versions: PaperVersion[];
  assignedReviewerCount?: number;
  completedReviewCount?: number;
  reviews?: Review[];
  decision?: PaperDecision | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewAssignment {
  id: string;
  paperId: string;
  reviewerId: string;
  reviewerPseudonym: string;
  reviewerName?: string; // Visible only to admin
  title: string;
  abstract: string;
  track: string;
  keywords: string[];
  authorPseudonym: string; // Reviewers only see pseudonym!
  currentVersion: number;
  fileUrl: string;
  fileHash: string;
  assignedAt: string;
  deadline: string;
  reviewStatus: 'pending' | 'submitted';
  review?: Review | null;
}

export interface ConferenceStats {
  totalPapers: number;
  submitted: number;
  underReview: number;
  accepted: number;
  rejected: number;
  revisionRequested: number;
  totalReviewers: number;
  totalAuthors: number;
  totalReviewsExpected: number;
  totalReviewsCompleted: number;
  blockchainEventsCount: number;
  latestBlockNumber: number;
}

export type BlockchainEventType =
  | 'PaperRegistered'
  | 'ReviewerAssigned'
  | 'ReviewSubmitted'
  | 'DecisionRecorded';

export interface BlockchainEvent {
  id: string;
  eventType: BlockchainEventType;
  paperId: string;
  version?: number;
  actorPseudonym: string;
  dataHash: string;
  txHash: string;
  blockNumber: number;
  timestamp: string;
  details?: Record<string, any>;
}

export interface VerificationResult {
  verified: boolean;
  matchStatus: 'MATCH_CONFIRMED' | 'HASH_MISMATCH' | 'RECORD_NOT_FOUND';
  calculatedHash: string;
  blockchainRecord?: {
    paperId: string;
    version: number;
    onChainHash: string;
    authorPseudonym: string;
    blockNumber: number;
    blockTimestamp: string;
    txHash: string;
  } | null;
  message?: string;
}
