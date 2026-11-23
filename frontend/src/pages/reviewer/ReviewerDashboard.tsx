import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { reviewService } from '../../services/reviewService';
import { ReviewAssignment, Review } from '../../types';
import { Button } from '../../components/common/Button';
import { Card, CardHeader, CardBody } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { BlockchainBadge } from '../../components/blockchain/BlockchainBadge';
import { HashViewer } from '../../components/blockchain/HashViewer';
import { SubmitReviewModal } from '../../components/reviewer/SubmitReviewModal';
import { ReviewDetailsModal } from '../../components/reviewer/ReviewDetailsModal';
import { TxExplorerModal } from '../../components/blockchain/TxExplorerModal';
import { formatDate } from '../../utils/formatters';
import {
  FileText,
  CheckCircle2,
  Clock,
  Eye,
  Award,
  Calendar,
  Lock,
} from 'lucide-react';

export const ReviewerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<ReviewAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [selectedForReview, setSelectedForReview] = useState<ReviewAssignment | null>(null);
  const [selectedReviewToView, setSelectedReviewToView] = useState<{
    review: Review;
    title: string;
  } | null>(null);
  const [selectedProofRecord, setSelectedProofRecord] = useState<any>(null);

  useEffect(() => {
    loadAssignedReviews();
  }, [user]);

  const loadAssignedReviews = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const data = await reviewService.getAssignedPapers(user);
      setAssignments(data);
    } catch (err) {
      console.error('Failed to load assignments:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const pendingAssignments = assignments.filter((a) => a.reviewStatus === 'pending');
  const completedAssignments = assignments.filter((a) => a.reviewStatus === 'submitted');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-emerald-500/20 px-3 py-1 rounded-full text-xs font-medium text-emerald-300 mb-2 border border-emerald-500/30 backdrop-blur-sm">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Strict Double-Blind Peer Review • Reviewer: {user?.pseudonymId}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              Peer Review Committee Portal
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mt-1 leading-relaxed">
              Evaluate assigned research manuscripts. Author identities are completely shielded behind
              cryptographic pseudonyms to ensure unbiased scientific evaluation.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right">
              <span className="text-[11px] text-slate-400 block">Assigned Workload</span>
              <span className="text-lg font-bold text-white">
                {completedAssignments.length} / {assignments.length} Completed
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Total Assigned
          </span>
          <div className="text-2xl font-bold text-slate-900">{assignments.length}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">Allocated by Conference Chairs</span>
        </Card>

        <Card className="p-4">
          <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider block mb-1">
            Pending Evaluations
          </span>
          <div className="text-2xl font-bold text-amber-700">{pendingAssignments.length}</div>
          <span className="text-[11px] text-amber-500/80 mt-1 block">Awaiting your feedback</span>
        </Card>

        <Card className="p-4">
          <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider block mb-1">
            Completed & Sealed
          </span>
          <div className="text-2xl font-bold text-emerald-700">{completedAssignments.length}</div>
          <span className="text-[11px] text-emerald-500/80 mt-1 block">Proof committed to ledger</span>
        </Card>
      </div>

      {/* Pending Reviews Section */}
      <Card>
        <CardHeader
          title={
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-600" />
              <span>Pending Reviews ({pendingAssignments.length})</span>
            </div>
          }
          description="Manuscripts requiring your score and scientific feedback"
        />

        <CardBody className="p-0">
          {isLoading ? (
            <LoadingSpinner message="Loading assigned manuscripts..." />
          ) : pendingAssignments.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="font-semibold text-slate-700">No pending reviews!</p>
              <p className="text-slate-400 mt-0.5">You have completed all current evaluations.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {pendingAssignments.map((asg) => (
                <div key={asg.id} className="p-5 sm:p-6 hover:bg-slate-50/50 transition-colors space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-semibold border border-slate-200">
                          {asg.paperId}
                        </span>
                        <span className="text-xs font-medium text-brand-600 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                          {asg.track}
                        </span>
                        <span className="font-mono text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded border border-purple-200">
                          Author: {asg.authorPseudonym}
                        </span>
                      </div>
                      <h3 className="text-base font-semibold text-slate-900 pt-1">{asg.title}</h3>
                    </div>

                    <div className="shrink-0">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => setSelectedForReview(asg)}
                        leftIcon={<Award className="w-4 h-4" />}
                      >
                        Submit Review
                      </Button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                    {asg.abstract}
                  </p>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        Deadline: {formatDate(asg.deadline)}
                      </span>
                      <span>Version: v{asg.currentVersion}</span>
                      <span className="text-slate-400">Document Hash:</span>
                      <HashViewer hash={asg.fileHash} type="fileHash" head={8} tail={6} />
                    </div>

                    <a
                      href={asg.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-semibold text-brand-600 hover:text-brand-800 flex items-center gap-1"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      View Manuscript
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Completed Reviews History */}
      <Card>
        <CardHeader
          title={
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>Review History & Integrity Proofs ({completedAssignments.length})</span>
            </div>
          }
          description="Reviews signed and anchored on the blockchain ledger"
        />

        <CardBody className="p-0">
          {completedAssignments.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No completed reviews submitted yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {completedAssignments.map((asg) => {
                const review = asg.review;
                if (!review) return null;
                return (
                  <div
                    key={asg.id}
                    className="p-5 sm:p-6 hover:bg-slate-50/50 transition-colors space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="font-mono text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-semibold border border-slate-200">
                            {asg.paperId}
                          </span>
                          <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                            {asg.track}
                          </span>
                          <Badge recommendation={review.recommendation} />
                        </div>
                        <h4 className="text-sm font-semibold text-slate-900">{asg.title}</h4>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <BlockchainBadge
                          verified={review.verified}
                          blockNumber={review.blockNumber}
                          onClick={() =>
                            setSelectedProofRecord({
                              paperId: asg.paperId,
                              fileHash: review.reviewHash,
                              txHash: review.blockchainTxHash,
                              blockNumber: review.blockNumber,
                              submittedAt: review.submittedAt,
                              actorPseudonym: review.reviewerPseudonym,
                            })
                          }
                        />
                      </div>
                    </div>

                    {/* Feedback summary */}
                    <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200 line-clamp-2 italic">
                      "{review.authorComments}"
                    </p>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
                      <div className="flex items-center gap-3 text-slate-500">
                        <span className="font-semibold text-slate-800">
                          Score: {review.overallScore.toFixed(1)} / 5.0
                        </span>
                        <span>Sealed: {formatDate(review.submittedAt)}</span>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedReviewToView({ review, title: asg.title })}
                        leftIcon={<Eye className="w-3.5 h-3.5" />}
                      >
                        View Full Review Record
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Modals */}
      <SubmitReviewModal
        isOpen={!!selectedForReview}
        onClose={() => setSelectedForReview(null)}
        assignment={selectedForReview}
        onSuccess={loadAssignedReviews}
      />

      <ReviewDetailsModal
        isOpen={!!selectedReviewToView}
        onClose={() => setSelectedReviewToView(null)}
        review={selectedReviewToView?.review || null}
        paperTitle={selectedReviewToView?.title}
      />

      <TxExplorerModal
        isOpen={!!selectedProofRecord}
        onClose={() => setSelectedProofRecord(null)}
        record={selectedProofRecord}
      />
    </div>
  );
};
