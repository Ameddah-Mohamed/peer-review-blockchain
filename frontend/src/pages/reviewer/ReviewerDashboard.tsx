import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { reviewService } from '../../services/reviewService';
import { ReviewAssignment, Review } from '../../types';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { BlockchainBadge } from '../../components/blockchain/BlockchainBadge';
import { SubmitReviewModal } from '../../components/reviewer/SubmitReviewModal';
import { ReviewDetailsModal } from '../../components/reviewer/ReviewDetailsModal';
import { TxExplorerModal } from '../../components/blockchain/TxExplorerModal';
import { formatDate } from '../../utils/formatters';
import {
  Clock,
  Eye,
  Award,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';

export const ReviewerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<ReviewAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending');

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
      setAssignments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load assignments:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadAssignedReviews();
  };

  const pendingAssignments = assignments.filter((a) => a.reviewStatus === 'pending');
  const completedAssignments = assignments.filter((a) => a.reviewStatus === 'submitted');

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Editorial Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Reviewer Pseudonym: {user?.pseudonymId}
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs text-slate-500 font-mono">Double-Blind Protected</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Peer Evaluation Desk
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Evaluate allocated research manuscripts objectively. All reviews are permanently sealed on the blockchain ledger under your cryptographic pseudonym.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            isLoading={isRefreshing}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />}
          >
            Sync Workload
          </Button>
        </div>
      </div>

      {/* Workload Progress Ribbon */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
          <div className="p-4 space-y-1">
            <div className="text-xs font-medium text-slate-500">Assigned Evaluations</div>
            <div className="text-2xl font-bold text-slate-900 tabular-nums">{assignments.length}</div>
            <div className="text-[11px] text-slate-400">Total papers allocated by chairs</div>
          </div>
          <div className="p-4 space-y-1">
            <div className="text-xs font-medium text-slate-500">Pending Review</div>
            <div className="text-2xl font-bold text-amber-600 tabular-nums">
              {pendingAssignments.length}
            </div>
            <div className="text-[11px] text-slate-400">Awaiting your evaluation & score</div>
          </div>
          <div className="p-4 space-y-1 bg-slate-50/50">
            <div className="text-xs font-medium text-slate-500">Completed & Sealed</div>
            <div className="text-2xl font-bold text-emerald-600 tabular-nums">
              {completedAssignments.length}
            </div>
            <div className="text-[11px] text-slate-400">Recorded on-chain with non-repudiation</div>
          </div>
        </div>
      </div>

      {/* Tabs & Active Filter */}
      <div className="flex items-center gap-2 border-b border-slate-200/90 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('pending')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
            activeTab === 'pending'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Pending Evaluations ({pendingAssignments.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('completed')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
            activeTab === 'completed'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>Completed History ({completedAssignments.length})</span>
        </button>
      </div>

      {/* Main Content Area */}
      {isLoading && assignments.length === 0 ? (
        <div className="py-12 bg-white rounded-xl border border-slate-200">
          <LoadingSpinner message="Querying assigned review committee workload..." />
        </div>
      ) : activeTab === 'pending' ? (
        <div className="space-y-4">
          {pendingAssignments.length === 0 ? (
            <div className="p-8 bg-white rounded-xl border border-slate-200 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
              <h3 className="text-sm font-bold text-slate-800">All assigned reviews completed</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                You have finished all manuscript evaluations in your current queue. Thank you for your service to the peer-review process!
              </p>
            </div>
          ) : (
            pendingAssignments.map((assignment) => (
              <div
                key={assignment.id}
                className="p-5 bg-white rounded-xl border border-slate-200/90 shadow-2xs space-y-4 transition-all hover:border-slate-300"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        Paper: {assignment.paperId}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">•</span>
                      <span className="text-xs text-slate-600 font-medium">{assignment.track}</span>
                      <span className="text-xs text-slate-400 font-mono">•</span>
                      <span className="text-xs font-mono text-emerald-700 bg-emerald-50 px-2 py-0.2 rounded border border-emerald-200">
                        Version {assignment.currentVersion || 1}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 tracking-tight">
                      {assignment.title}
                    </h3>
                  </div>

                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setSelectedForReview(assignment)}
                    leftIcon={<Award className="w-3.5 h-3.5" />}
                  >
                    Submit Review
                  </Button>
                </div>

                {assignment.abstract && (
                  <p className="text-xs text-slate-600 leading-relaxed font-sans bg-slate-50/70 p-3 rounded-lg border border-slate-100">
                    {assignment.abstract}
                  </p>
                )}

                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-700">Author Pseudonym:</span>
                    <span className="font-mono text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      {assignment.authorPseudonym}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 font-mono text-[11px]">
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    <span>Allocated: {formatDate(assignment.assignedAt)}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {completedAssignments.length === 0 ? (
            <div className="p-8 bg-white rounded-xl border border-slate-200 text-center">
              <p className="text-xs text-slate-500">No completed evaluations in this review cycle.</p>
            </div>
          ) : (
            completedAssignments.map((assignment) => (
              <div
                key={assignment.id}
                className="p-5 bg-white rounded-xl border border-slate-200/90 shadow-2xs space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 font-mono mb-1">
                      <span>{assignment.paperId}</span>
                      <span>•</span>
                      <span>{assignment.track}</span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900">{assignment.title}</h3>
                  </div>

                  <div className="flex items-center gap-2">
                    {assignment.review && (
                      <Badge recommendation={assignment.review.recommendation} />
                    )}
                    <Button
                      variant="outline"
                      size="xs"
                      onClick={() =>
                        assignment.review &&
                        setSelectedReviewToView({
                          review: assignment.review,
                          title: assignment.title,
                        })
                      }
                      leftIcon={<Eye className="w-3 h-3" />}
                    >
                      View Review
                    </Button>
                  </div>
                </div>

                {assignment.review && (
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-700">Overall Score:</span>
                      <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                        {assignment.review.overallScore.toFixed(1)} / 5.0
                      </span>
                    </div>

                    <BlockchainBadge
                      verified={assignment.review.verified}
                      blockNumber={assignment.review.blockNumber}
                      onClick={() =>
                        setSelectedProofRecord({
                          paperId: assignment.paperId,
                          version: assignment.currentVersion || 1,
                          fileHash: assignment.review?.reviewHash,
                          txHash: assignment.review?.blockchainTxHash,
                          blockNumber: assignment.review?.blockNumber,
                          submittedAt: assignment.review?.submittedAt,
                          actorPseudonym: user?.pseudonymId,
                        })
                      }
                    />
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

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
