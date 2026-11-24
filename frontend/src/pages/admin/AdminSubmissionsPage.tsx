import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { mockAdapter } from '../../services/mockAdapter';
import { Paper, Review } from '../../types';
import { Button } from '../../components/common/Button';
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
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export const AdminSubmissionsPage: React.FC = () => {
  const [submissions, setSubmissions] = useState<Paper[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [trackFilter, setTrackFilter] = useState<string>('all');
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

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
    let resolved = false;

    const safetyTimer = setTimeout(async () => {
      if (!resolved) {
        try {
          const fallback = await mockAdapter.getAllSubmissions();
          setSubmissions(fallback);
        } catch {}
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }, 3500);

    try {
      const data = await adminService.getSubmissions();
      resolved = true;
      clearTimeout(safetyTimer);
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
      resolved = true;
      clearTimeout(safetyTimer);
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadSubmissions();
  };

  const filtered = submissions.filter((p) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      p.title.toLowerCase().includes(q) ||
      p.id.toLowerCase().includes(q) ||
      p.authorPseudonym.toLowerCase().includes(q);
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    const matchesTrack = trackFilter === 'all' || p.track === trackFilter;
    return matchesSearch && matchesStatus && matchesTrack;
  });

  const allTracks = Array.from(new Set(submissions.map((p) => p.track).filter(Boolean)));

  const toggleRow = (id: string) => {
    setExpandedRowId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-slate-500 mb-1">
              <span>ICDS 2026</span>
              <span>/</span>
              <span>Submissions</span>
              <span>/</span>
              <span className="text-slate-800 font-medium">Registry</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Submissions Management
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Manuscript registry, double-blind committee assignment, reviewer progress, and editorial decisions.
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

      {/* Filter Toolbar */}
      <div className="bg-white p-3 rounded-lg border border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, paper ID, or author pseudonym..."
            className="w-full text-xs pl-8 pr-3 py-1.5 rounded-md border border-slate-200 focus:outline-none focus:border-slate-400 bg-slate-50/50"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <select
            value={trackFilter}
            onChange={(e) => setTrackFilter(e.target.value)}
            className="text-xs px-2.5 py-1.5 rounded-md border border-slate-200 bg-white text-slate-700 focus:outline-none focus:border-slate-400"
          >
            <option value="all">All Tracks ({allTracks.length})</option>
            {allTracks.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs px-2.5 py-1.5 rounded-md border border-slate-200 bg-white text-slate-700 focus:outline-none focus:border-slate-400"
          >
            <option value="all">All Statuses</option>
            <option value="submitted">Submitted</option>
            <option value="under_review">Under Review</option>
            <option value="revision_requested">Revision Requested</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
          </select>

          <span className="text-xs font-mono text-slate-400 pl-2 border-l border-slate-200 tabular-nums">
            {filtered.length} {filtered.length === 1 ? 'paper' : 'papers'}
          </span>
        </div>
      </div>

      {/* Academic Data Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-2xs">
        {isLoading ? (
          <div className="py-12">
            <LoadingSpinner message="Loading submissions registry..." />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title="No submissions match your query"
              description="Adjust search keywords or clear active track and status filters."
              actionText="Reset Filters"
              onAction={() => {
                setSearchQuery('');
                setStatusFilter('all');
                setTrackFilter('all');
              }}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="academic-table">
              <thead>
                <tr>
                  <th className="w-10"></th>
                  <th className="w-24">ID</th>
                  <th>Title & Abstract</th>
                  <th>Track</th>
                  <th>Author</th>
                  <th>Status</th>
                  <th>Reviewers</th>
                  <th>Ledger Proof</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((paper) => {
                  const latestVer =
                    paper.versions?.find((v) => v.version === paper.currentVersion) ||
                    (paper.versions?.length ? paper.versions[paper.versions.length - 1] : null);
                  const reviews = paper.reviews || [];
                  const isExpanded = expandedRowId === paper.id;
                  const avgScore =
                    reviews.length > 0
                      ? (reviews.reduce((acc, r) => acc + r.overallScore, 0) / reviews.length).toFixed(1)
                      : null;

                  return (
                    <React.Fragment key={paper.id}>
                      <tr className={isExpanded ? 'bg-slate-50/80' : ''}>
                        <td className="w-8 pr-0">
                          <button
                            type="button"
                            onClick={() => toggleRow(paper.id)}
                            className="p-1 text-slate-400 hover:text-slate-700 transition-colors"
                            title={isExpanded ? 'Collapse row' : 'Expand details'}
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </td>
                        <td className="font-mono text-xs font-semibold text-slate-800 whitespace-nowrap">
                          {paper.id}
                        </td>
                        <td>
                          <div className="font-semibold text-slate-900 text-xs">
                            {paper.title}
                          </div>
                          <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5 max-w-md">
                            {paper.abstract}
                          </div>
                        </td>
                        <td className="text-xs text-slate-600 whitespace-nowrap">
                          <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[11px]">
                            {paper.track}
                          </span>
                        </td>
                        <td className="font-mono text-xs text-slate-600 whitespace-nowrap">
                          {paper.authorPseudonym}
                        </td>
                        <td className="whitespace-nowrap">
                          <Badge status={paper.status} size="xs" />
                        </td>
                        <td className="text-xs text-slate-700 whitespace-nowrap tabular-nums">
                          <span className="font-medium">{reviews.length}</span> / {paper.assignedReviewerCount || 0}
                          {avgScore && (
                            <span className="ml-1 text-[10px] text-slate-500 font-mono">
                              ({avgScore}★)
                            </span>
                          )}
                        </td>
                        <td className="whitespace-nowrap">
                          {latestVer ? (
                            <BlockchainBadge
                              size="xs"
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
                          ) : (
                            <span className="text-slate-400 text-xs">—</span>
                          )}
                        </td>
                        <td className="text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="outline"
                              size="xs"
                              onClick={() => setPaperToAssign(paper)}
                              leftIcon={<Users className="w-3 h-3 text-slate-400" />}
                            >
                              Assign
                            </Button>
                            <Button
                              variant="primary"
                              size="xs"
                              onClick={() => setPaperToDecide(paper)}
                              leftIcon={<Award className="w-3 h-3 text-slate-400" />}
                            >
                              Decision
                            </Button>
                          </div>
                        </td>
                      </tr>

                      {/* Expandable Details Drawer Row */}
                      {isExpanded && (
                        <tr className="bg-slate-50/50">
                          <td colSpan={9} className="p-4 pl-12 border-b border-slate-200">
                            <div className="space-y-3 max-w-4xl">
                              <div>
                                <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                                  Abstract
                                </h4>
                                <p className="text-xs text-slate-700 leading-relaxed bg-white p-3 rounded border border-slate-200">
                                  {paper.abstract}
                                </p>
                              </div>

                              {/* Review evaluations */}
                              <div>
                                <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                                  Review Evaluations ({reviews.length})
                                </h4>
                                {reviews.length > 0 ? (
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {reviews.map((r, i) => (
                                      <div
                                        key={r.id || i}
                                        className="bg-white p-3 rounded border border-slate-200 flex items-center justify-between"
                                      >
                                        <div>
                                          <div className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                                            <span>{r.reviewerPseudonym}</span>
                                            <span className="text-[10px] text-slate-500 font-mono">
                                              Score: {r.overallScore.toFixed(1)} / 5.0
                                            </span>
                                          </div>
                                          <div className="text-[11px] text-slate-500 mt-0.5">
                                            Recommendation: <span className="capitalize">{r.recommendation?.replace('_', ' ')}</span>
                                          </div>
                                        </div>
                                        <Button
                                          variant="ghost"
                                          size="xs"
                                          onClick={() =>
                                            setSelectedReviewToInspect({ review: r, title: paper.title })
                                          }
                                          leftIcon={<Eye className="w-3 h-3" />}
                                        >
                                          View
                                        </Button>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-xs text-slate-400 italic">
                                    No reviews submitted yet for this manuscript.
                                  </p>
                                )}
                              </div>

                              {/* Action Footer */}
                              <div className="flex items-center gap-2 pt-1">
                                <Button
                                  variant="secondary"
                                  size="xs"
                                  onClick={() => setPaperHistory(paper)}
                                  leftIcon={<History className="w-3 h-3" />}
                                >
                                  Version History ({paper.versions?.length || 1})
                                </Button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

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
