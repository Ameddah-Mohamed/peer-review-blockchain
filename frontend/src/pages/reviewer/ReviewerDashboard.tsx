import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { reviewService } from '../../services/reviewService';
import { ReviewAssignment, Review } from '../../types';
import { Button } from '../../components/common/Button';
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
  Clock,
  Eye,
  Award,
  Calendar,
  RefreshCw,
  ExternalLink,
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-slate-500 mb-1">
              <span>Program Committee</span>
              <span>/</span>
              <span>Reviewer: <strong className="text-slate-700">{user?.pseudonymId}</strong></span>
              <span>/</span>
              <span>Assigned Workload</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Peer Review Committee Portal
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Double-blind manuscript evaluation. Author real names and institutional affiliations are cryptographically blinded.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              isLoading={isRefreshing}
              leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />}
            >
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Understated Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 border-b border-slate-200 pb-6">
        <div className="bg-white p-3.5 rounded-lg border border-slate-200">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Total Allocated
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">
            {assignments.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Assigned by committee chairs</div>
        </div>

        <div className="bg-white p-3.5 rounded-lg border border-slate-200">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Pending Evaluations
          </div>
          <div className="text-2xl font-bold text-amber-700 mt-1 tabular-nums">
            {pendingAssignments.length}
          </div>
          <div className="text-[11px] text-amber-600/80 mt-0.5">Awaiting evaluation & score</div>
        </div>

        <div className="bg-white p-3.5 rounded-lg border border-slate-200 col-span-2 sm:col-span-1">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Completed & Sealed
          </div>
          <div className="text-2xl font-bold text-emerald-700 mt-1 tabular-nums">
            {completedAssignments.length}
          </div>
          <div className="text-[11px] text-emerald-600/80 mt-0.5">Anchored on distributed ledger</div>
        </div>
      </div>

      {/* Tabs Toolbar */}
      <div className="flex items-center justify-between border-b border-slate-200">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setActiveTab('pending')}
            className={`pb-3 text-xs font-semibold tracking-tight transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === 'pending'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Pending Evaluations</span>
            <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.2 rounded text-slate-600">
              {pendingAssignments.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('completed')}
            className={`pb-3 text-xs font-semibold tracking-tight transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === 'completed'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Completed History</span>
            <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.2 rounded text-slate-600">
              {completedAssignments.length}
            </span>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {isLoading ? (
        <div className="py-12 bg-white rounded-lg border border-slate-200">
          <LoadingSpinner message="Loading assigned manuscripts..." />
        </div>
      ) : activeTab === 'pending' ? (
        pendingAssignments.length === 0 ? (
          <div className="bg-white rounded-lg border border-slate-200 p-8 text-center">
            <h3 className="text-sm font-semibold text-slate-800">All pending evaluations completed</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              You have evaluated all current assigned manuscripts. Any new allocations from conference chairs will appear here.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-slate-200 divide-y divide-slate-100 shadow-2xs">
            {pendingAssignments.map((asg) => (
              <div key={asg.id} className="p-5 sm:p-6 hover:bg-slate-50/50 transition-colors space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-semibold border border-slate-200">
                        {asg.paperId}
                      </span>
                      <span className="text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {asg.track}
                      </span>
                      <span className="font-mono text-xs bg-slate-50 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                        Author: {asg.authorPseudonym}
                      </span>
                      <span className="text-xs font-mono text-slate-400">
                        v{asg.currentVersion}
                      </span>
                    </div>
                    <h3 className="text-base font-semibold text-slate-900 pt-1 leading-snug">
                      {asg.title}
                    </h3>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    <Button
                      variant="primary"
                      size="xs"
                      onClick={() => setSelectedForReview(asg)}
                      leftIcon={<Award className="w-3.5 h-3.5" />}
                    >
                      Submit Review
                    </Button>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                  {asg.abstract}
                </p>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                    <span className="flex items-center gap-1 tabular-nums">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      Deadline: {formatDate(asg.deadline)}
                    </span>
                    <span>•</span>
                    <div className="inline-flex items-center gap-1.5">
                      <span className="text-slate-400 font-mono text-[10px]">SHA-256:</span>
                      <HashViewer hash={asg.fileHash} type="fileHash" head={6} tail={4} />
                    </div>
                  </div>

                  <a
                    href={asg.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-slate-700 hover:text-slate-900 inline-flex items-center gap-1 transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                    <span>View Manuscript (PDF)</span>
                    <ExternalLink className="w-3 h-3 text-slate-300" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        completedAssignments.length === 0 ? (
          <div className="bg-white rounded-lg border border-slate-200 p-8 text-center text-xs text-slate-400">
            No completed reviews recorded yet.
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-slate-200 divide-y divide-slate-100 shadow-2xs">
            {completedAssignments.map((asg) => {
              const review = asg.review;
              if (!review) return null;

              return (
                <div key={asg.id} className="p-5 sm:p-6 hover:bg-slate-50/50 transition-colors space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-mono text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-semibold border border-slate-200">
                          {asg.paperId}
                        </span>
                        <span className="text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {asg.track}
                        </span>
                        <Badge recommendation={review.recommendation} size="xs" />
                      </div>
                      <h4 className="text-sm font-semibold text-slate-900">{asg.title}</h4>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      <BlockchainBadge
                        size="xs"
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

                  {/* Feedback preview */}
                  <p className="text-xs text-slate-600 bg-slate-50/70 p-3 rounded border border-slate-200 line-clamp-2 italic">
                    "{review.authorComments}"
                  </p>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
                    <div className="flex items-center gap-3 text-slate-500 tabular-nums">
                      <span className="font-semibold text-slate-800">
                        Score: {review.overallScore.toFixed(1)} / 5.0
                      </span>
                      <span>•</span>
                      <span>Sealed: {formatDate(review.submittedAt)}</span>
                    </div>

                    <Button
                      variant="outline"
                      size="xs"
                      onClick={() => setSelectedReviewToView({ review, title: asg.title })}
                      leftIcon={<Eye className="w-3 h-3 text-slate-400" />}
                    >
                      View Sealed Evaluation
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )
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
