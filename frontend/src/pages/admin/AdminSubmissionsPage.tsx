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

  const toggleExpand = (id: string) => {
    setExpandedRowId((prev) => (prev === id ? null : id));
  };

  if (isLoading && submissions.length === 0) {
    return <LoadingSpinner message="Loading manuscript records and reviewer assignments..." />;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Double-Blind Review Desk
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs text-slate-500 font-mono">
              {submissions.length} Total Registered
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Manuscript Submissions Registry
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Manage peer-review committee assignments, verify blind anonymity compliance, and seal formal editorial decisions on the blockchain.
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
            Sync Registry
          </Button>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by manuscript title, ID, or author pseudonym..."
            className="w-full text-xs pl-9 pr-3.5 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-slate-400 bg-slate-50/50"
          />
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <span className="text-slate-400 font-medium text-[11px]">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:border-slate-400"
            >
              <option value="all">All Statuses ({submissions.length})</option>
              <option value="under_review">Under Review</option>
              <option value="submitted">Submitted</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
              <option value="revision_requested">Revision Requested</option>
            </select>
          </div>

          {/* Track Filter */}
          {allTracks.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <span className="text-slate-400 font-medium text-[11px]">Track:</span>
              <select
                value={trackFilter}
                onChange={(e) => setTrackFilter(e.target.value)}
                className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:border-slate-400"
              >
                <option value="all">All Tracks</option>
                {allTracks.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Main Submissions Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="modern-table">
            <thead>
              <tr>
                <th className="w-10"></th>
                <th className="w-24">ID</th>
                <th>Manuscript Title & Track</th>
                <th>Author</th>
                <th>Status</th>
                <th>Reviews</th>
                <th>Score</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((paper) => {
                const isExpanded = expandedRowId === paper.id;
                const reviews = paper.reviews || [];
                const averageScore =
                  reviews.length > 0
                    ? (reviews.reduce((acc, r) => acc + r.overallScore, 0) / reviews.length).toFixed(1)
                    : null;

                const latestVer =
                  paper.versions?.find((v) => v.version === paper.currentVersion) ||
                  paper.versions?.[0];

                return (
                  <React.Fragment key={paper.id}>
                    <tr
                      className={`cursor-pointer transition-colors ${
                        isExpanded ? 'bg-slate-50/90' : 'hover:bg-slate-50/60'
                      }`}
                      onClick={() => toggleExpand(paper.id)}
                    >
                      <td className="text-center text-slate-400 w-10">
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 mx-auto" />
                        ) : (
                          <ChevronDown className="w-4 h-4 mx-auto" />
                        )}
                      </td>
                      <td className="font-mono text-xs font-semibold text-slate-700 whitespace-nowrap">
                        {paper.id}
                      </td>
                      <td>
                        <div className="font-semibold text-slate-900 text-xs truncate max-w-sm">
                          {paper.title}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                          <span>{paper.track}</span>
                          <span className="text-slate-300">•</span>
                          <span className="font-mono text-slate-400">
                            v{paper.currentVersion} ({paper.versions?.length || 1} rev)
                          </span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap">
                        <span className="font-mono text-xs text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {paper.authorPseudonym}
                        </span>
                      </td>
                      <td className="whitespace-nowrap">
                        <Badge status={paper.status} size="sm" />
                      </td>
                      <td className="whitespace-nowrap font-mono text-xs text-slate-700">
                        <span
                          className={`inline-block w-2 h-2 rounded-full mr-1.5 ${
                            (paper.completedReviewCount || 0) >= (paper.assignedReviewerCount || 1)
                              ? 'bg-emerald-500'
                              : (paper.completedReviewCount || 0) > 0
                              ? 'bg-amber-500'
                              : 'bg-slate-300'
                          }`}
                        />
                        {paper.completedReviewCount || 0} / {paper.assignedReviewerCount || 0}
                      </td>
                      <td className="whitespace-nowrap font-mono text-xs text-slate-800">
                        {averageScore ? (
                          <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            {averageScore} / 5
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td
                        className="text-right whitespace-nowrap space-x-1.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button
                          variant="secondary"
                          size="xs"
                          onClick={() => setPaperToAssign(paper)}
                          leftIcon={<Users className="w-3 h-3" />}
                        >
                          Assign
                        </Button>
                        <Button
                          variant="primary"
                          size="xs"
                          onClick={() => setPaperToDecide(paper)}
                          leftIcon={<Award className="w-3 h-3" />}
                        >
                          Decide
                        </Button>
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => setPaperHistory(paper)}
                          title="View Version Timeline"
                        >
                          <History className="w-3.5 h-3.5 text-slate-500" />
                        </Button>
                      </td>
                    </tr>

                    {/* Expandable Details Drawer */}
                    {isExpanded && (
                      <tr className="bg-slate-50/50">
                        <td colSpan={8} className="p-4 sm:p-6 border-b border-slate-200">
                          <div className="space-y-4 max-w-5xl">
                            {/* Abstract Section */}
                            <div>
                              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                                Abstract
                              </div>
                              <p className="text-xs text-slate-700 leading-relaxed font-sans bg-white p-3 rounded-lg border border-slate-200">
                                {paper.abstract || 'No abstract provided for this submission.'}
                              </p>
                            </div>

                            {/* Reviews & Committee Evaluations */}
                            <div>
                              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                                Peer Review Evaluations ({reviews.length} submitted)
                              </div>
                              {reviews.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                                  {reviews.map((r, idx) => (
                                    <div
                                      key={r.id || idx}
                                      className="p-3 bg-white rounded-lg border border-slate-200 space-y-2"
                                    >
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1.5 font-mono text-xs font-semibold text-slate-800">
                                          <span>{r.reviewerPseudonym}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <Badge recommendation={r.recommendation} size="xs" />
                                          <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded">
                                            {r.overallScore.toFixed(1)}/5
                                          </span>
                                        </div>
                                      </div>

                                      <p className="text-xs text-slate-600 line-clamp-2 italic">
                                        "{r.authorComments}"
                                      </p>

                                      <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px]">
                                        <button
                                          type="button"
                                          onClick={() =>
                                            setSelectedReviewToInspect({
                                              review: r,
                                              title: paper.title,
                                            })
                                          }
                                          className="text-emerald-700 hover:text-emerald-800 font-medium inline-flex items-center gap-1"
                                        >
                                          <Eye className="w-3 h-3" />
                                          <span>Inspect Full Review</span>
                                        </button>

                                        <BlockchainBadge
                                          verified={r.verified}
                                          blockNumber={r.blockNumber}
                                          size="xs"
                                        />
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-xs text-slate-500 italic bg-white p-3 rounded-lg border border-slate-200">
                                  No peer evaluations have been recorded on the ledger yet. Use "Assign" to allocate committee reviewers.
                                </p>
                              )}
                            </div>

                            {/* Ledger Provenance Strip */}
                            {latestVer && (
                              <div className="p-3 bg-white rounded-lg border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-slate-800">
                                    Latest SHA-256 Checksum:
                                  </span>
                                  <span className="font-mono text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                                    {latestVer.fileHash.slice(0, 16)}...{latestVer.fileHash.slice(-12)}
                                  </span>
                                </div>

                                <div className="flex items-center gap-2">
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
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12">
                    <EmptyState
                      title="No manuscripts match the filter"
                      description="Try adjusting your keyword query, submission status, or track filter."
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Modals */}
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
