import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { mockAdapter } from '../../services/mockAdapter';
import { Paper, Review } from '../../types';
import { Button } from '../../components/common/Button';
import { Card, CardHeader, CardBody } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { BlockchainBadge } from '../../components/blockchain/BlockchainBadge';
import { AssignReviewerModal } from '../../components/admin/AssignReviewerModal';
import { MakeDecisionModal } from '../../components/admin/MakeDecisionModal';
import { VersionHistoryModal } from '../../components/author/VersionHistoryModal';
import { ReviewDetailsModal } from '../../components/reviewer/ReviewDetailsModal';
import { TxExplorerModal } from '../../components/blockchain/TxExplorerModal';
import {
  Search,
  Users,
  Award,
  History,
  Eye,
} from 'lucide-react';

export const AdminSubmissionsPage: React.FC = () => {
  const [submissions, setSubmissions] = useState<Paper[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [trackFilter, setTrackFilter] = useState<string>('all');

  // Modals
  const [paperToAssign, setPaperToAssign] = useState<Paper | null>(null);
  const [paperToDecide, setPaperToDecide] = useState<Paper | null>(null);
  const [paperHistory, setPaperHistory] = useState<Paper | null>(null);
  const [selectedReviewToInspect, setSelectedReviewToInspect] = useState<{
    review: Review;
    title: string;
  } | null>(null);
  const [selectedProof, setSelectedProof] = useState<any>(null);

  useEffect(() => {
    loadSubmissions();
  }, []);

  const loadSubmissions = async () => {
    setIsLoading(true);
    try {
      const data = await adminService.getSubmissions();
      setSubmissions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load submissions, falling back to mock submissions:', err);
      try {
        const fallback = await mockAdapter.getAllSubmissions();
        setSubmissions(fallback);
      } catch (mockErr) {
        console.error('Mock fallback error:', mockErr);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const filtered = submissions.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.authorPseudonym.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    const matchesTrack = trackFilter === 'all' || p.track === trackFilter;
    return matchesSearch && matchesStatus && matchesTrack;
  });

  const allTracks = Array.from(new Set(submissions.map((p) => p.track)));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Submission Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Assign reviewers, evaluate peer review scores, and record immutable final decisions.
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={loadSubmissions}>
          Refresh Submissions
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, paper ID, or pseudonym..."
              className="w-full text-xs pl-9 pr-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full text-xs px-3 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-white"
            >
              <option value="all">All Statuses</option>
              <option value="submitted">Submitted (Needs Reviewers)</option>
              <option value="under_review">Under Review</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
              <option value="revision_requested">Revision Requested</option>
            </select>
          </div>

          <div>
            <select
              value={trackFilter}
              onChange={(e) => setTrackFilter(e.target.value)}
              className="w-full text-xs px-3 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-white"
            >
              <option value="all">All Conference Tracks</option>
              {allTracks.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Submissions List */}
      <Card>
        <CardHeader
          title={`Conference Papers (${filtered.length})`}
          description="Click to assign reviewers or record on-chain decision"
        />

        <CardBody className="p-0">
          {isLoading ? (
            <LoadingSpinner message="Loading submissions..." />
          ) : filtered.length === 0 ? (
            <EmptyState
              title="No submissions match your filters"
              description="Try adjusting your search criteria or clear active filters."
            />
          ) : (
            <div className="divide-y divide-slate-100">
              {filtered.map((paper) => {
                const latestVer =
                  paper.versions?.find((v) => v.version === paper.currentVersion) ||
                  (paper.versions?.length ? paper.versions[paper.versions.length - 1] : null);
                const reviews = paper.reviews || [];
                const avgScore =
                  reviews.length > 0
                    ? (reviews.reduce((acc, r) => acc + r.overallScore, 0) / reviews.length).toFixed(1)
                    : null;

                return (
                  <div
                    key={paper.id}
                    className="p-5 sm:p-6 hover:bg-slate-50/50 transition-colors space-y-3.5"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-semibold border border-slate-200">
                            {paper.id}
                          </span>
                          <span className="text-xs font-medium text-brand-600 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                            {paper.track}
                          </span>
                          <Badge status={paper.status} />
                          <span className="font-mono text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded border border-purple-200">
                            Author: {paper.authorPseudonym}
                          </span>
                        </div>
                        <h3 className="text-base font-semibold text-slate-900 pt-1 leading-snug">
                          {paper.title}
                        </h3>
                      </div>

                      <div className="shrink-0 flex items-center gap-2">
                        {latestVer && (
                          <BlockchainBadge
                            verified={latestVer.verified}
                            blockNumber={latestVer.blockNumber}
                            onClick={() =>
                              setSelectedProof({
                                paperId: paper.id,
                                version: latestVer.version,
                                fileHash: latestVer.fileHash,
                                txHash: latestVer.blockchainTxHash,
                                blockNumber: latestVer.blockNumber,
                                submittedAt: latestVer.submittedAt,
                                actorPseudonym: paper.authorPseudonym,
                              })
                            }
                          />
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {paper.abstract}
                    </p>

                    {/* Review committee status row */}
                    <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div className="flex flex-wrap items-center gap-4">
                        <span className="text-slate-600 font-medium flex items-center gap-1.5">
                          <Users className="w-4 h-4 text-slate-400" />
                          Reviewers: {paper.assignedReviewerCount || 0} assigned
                        </span>
                        <span className="text-slate-600 font-medium">
                          Reviews Completed: {reviews.length}
                        </span>
                        {avgScore && (
                          <span className="font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                            Average Score: {avgScore} / 5.0
                          </span>
                        )}
                      </div>

                      {reviews.length > 0 && (
                        <div className="flex items-center gap-2">
                          {reviews.map((r, i) => (
                            <button
                              key={r.id || i}
                              type="button"
                              onClick={() => setSelectedReviewToInspect({ review: r, title: paper.title })}
                              className="inline-flex items-center gap-1 text-[11px] font-mono bg-white px-2 py-1 rounded border border-slate-200 hover:border-brand-500 transition-colors"
                            >
                              <Eye className="w-3 h-3 text-slate-400" />
                              <span>{r.reviewerPseudonym}</span>
                              <span className="font-bold text-slate-700">({r.overallScore.toFixed(1)})</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPaperHistory(paper)}
                          leftIcon={<History className="w-3.5 h-3.5" />}
                        >
                          Versions ({paper.versions.length})
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPaperToAssign(paper)}
                          leftIcon={<Users className="w-3.5 h-3.5" />}
                        >
                          Assign Reviewers
                        </Button>
                      </div>

                      <div>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => setPaperToDecide(paper)}
                          leftIcon={<Award className="w-3.5 h-3.5" />}
                        >
                          Record Decision
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Modals */}
      <AssignReviewerModal
        isOpen={!!paperToAssign}
        onClose={() => setPaperToAssign(null)}
        paper={paperToAssign}
        onSuccess={loadSubmissions}
      />

      <MakeDecisionModal
        isOpen={!!paperToDecide}
        onClose={() => setPaperToDecide(null)}
        paper={paperToDecide}
        onSuccess={loadSubmissions}
      />

      <VersionHistoryModal
        isOpen={!!paperHistory}
        onClose={() => setPaperHistory(null)}
        paper={paperHistory}
      />

      <ReviewDetailsModal
        isOpen={!!selectedReviewToInspect}
        onClose={() => setSelectedReviewToInspect(null)}
        review={selectedReviewToInspect?.review || null}
        paperTitle={selectedReviewToInspect?.title}
      />

      <TxExplorerModal
        isOpen={!!selectedProof}
        onClose={() => setSelectedProof(null)}
        record={selectedProof}
      />
    </div>
  );
};
