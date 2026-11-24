import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { paperService } from '../../services/paperService';
import { Paper } from '../../types';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { BlockchainBadge } from '../../components/blockchain/BlockchainBadge';
import { HashViewer } from '../../components/blockchain/HashViewer';
import { TxExplorerModal } from '../../components/blockchain/TxExplorerModal';
import { UploadPaperModal } from '../../components/author/UploadPaperModal';
import { UploadVersionModal } from '../../components/author/UploadVersionModal';
import { VersionHistoryModal } from '../../components/author/VersionHistoryModal';
import { formatDate } from '../../utils/formatters';
import {
  Upload,
  History,
  RefreshCw,
  GitCommit,
  Award,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export const AuthorDashboard: React.FC = () => {
  const { user } = useAuth();
  const [papers, setPapers] = useState<Paper[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expandedPaperId, setExpandedPaperId] = useState<string | null>(null);

  // Modals state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedPaperForVersion, setSelectedPaperForVersion] = useState<Paper | null>(null);
  const [selectedPaperForHistory, setSelectedPaperForHistory] = useState<Paper | null>(null);
  const [selectedProofRecord, setSelectedProofRecord] = useState<any>(null);

  useEffect(() => {
    loadMySubmissions();
  }, [user]);

  const loadMySubmissions = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const data = await paperService.getMySubmissions(user);
      setPapers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load author submissions:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadMySubmissions();
  };

  const totalSubmissions = papers.length;
  const underReviewCount = papers.filter((p) => p.status === 'under_review').length;
  const acceptedCount = papers.filter((p) => p.status === 'accepted').length;
  const revisionsCount = papers.filter((p) => p.status === 'revision_requested').length;

  const toggleExpand = (id: string) => {
    setExpandedPaperId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Editorial Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Author Pseudonym: {user?.pseudonymId}
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs text-slate-500 font-mono">Double-Blind Shielded</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Manuscript Research Workspace
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Register new research manuscripts with instant SHA-256 blockchain timestamping, track double-blind committee reviews, and submit revisions.
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
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsUploadOpen(true)}
            leftIcon={<Upload className="w-3.5 h-3.5" />}
          >
            Submit Manuscript
          </Button>
        </div>
      </div>

      {/* Author Pipeline Ribbon */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-100">
          <div className="p-4 space-y-1">
            <div className="text-xs font-medium text-slate-500">My Submissions</div>
            <div className="text-2xl font-bold text-slate-900 tabular-nums">{totalSubmissions}</div>
            <div className="text-[11px] text-slate-400">Total papers registered on ledger</div>
          </div>
          <div className="p-4 space-y-1">
            <div className="text-xs font-medium text-slate-500">In Peer Review</div>
            <div className="text-2xl font-bold text-amber-600 tabular-nums">{underReviewCount}</div>
            <div className="text-[11px] text-slate-400">Currently undergoing evaluation</div>
          </div>
          <div className="p-4 space-y-1">
            <div className="text-xs font-medium text-slate-500">Accepted Papers</div>
            <div className="text-2xl font-bold text-emerald-600 tabular-nums">{acceptedCount}</div>
            <div className="text-[11px] text-slate-400">Approved for conference publication</div>
          </div>
          <div className="p-4 space-y-1 bg-slate-50/50">
            <div className="text-xs font-medium text-slate-500">Revisions Requested</div>
            <div className="text-2xl font-bold text-sky-600 tabular-nums">{revisionsCount}</div>
            <div className="text-[11px] text-slate-400">Awaiting author responses / v2</div>
          </div>
        </div>
      </div>

      {/* Main Manuscript List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">
            Manuscript Registry & Review Status
          </h2>
          <span className="text-xs text-slate-400 font-mono">
            {papers.length} {papers.length === 1 ? 'record' : 'records'}
          </span>
        </div>

        {isLoading && papers.length === 0 ? (
          <div className="py-12 bg-white rounded-xl border border-slate-200">
            <LoadingSpinner message="Querying your manuscript submissions..." />
          </div>
        ) : papers.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8">
            <EmptyState
              title="No manuscripts submitted yet"
              description="Upload your first research paper to establish immutable blockchain timestamping and enter the double-blind review pipeline."
              actionText="Submit First Manuscript"
              onAction={() => setIsUploadOpen(true)}
            />
          </div>
        ) : (
          <div className="space-y-3">
            {papers.map((paper) => {
              const isExpanded = expandedPaperId === paper.id;
              const latestVer =
                paper.versions?.find((v) => v.version === paper.currentVersion) ||
                paper.versions?.[0];
              const reviews = paper.reviews || [];

              return (
                <div
                  key={paper.id}
                  className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden transition-all hover:border-slate-300"
                >
                  {/* Summary Bar */}
                  <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          {paper.id}
                        </span>
                        <Badge status={paper.status} size="sm" />
                        <span className="text-xs text-slate-400 font-mono">•</span>
                        <span className="text-xs text-slate-600 font-medium">{paper.track}</span>
                        <span className="text-xs text-slate-400 font-mono">•</span>
                        <span className="text-xs font-mono text-emerald-700 bg-emerald-50 px-2 py-0.2 rounded border border-emerald-200">
                          Version {paper.currentVersion}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-slate-900 tracking-tight">
                        {paper.title}
                      </h3>

                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {paper.abstract}
                      </p>
                    </div>

                    {/* Actions & Proofs */}
                    <div className="flex flex-wrap items-center gap-2 shrink-0 md:self-center">
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => setSelectedPaperForVersion(paper)}
                        leftIcon={<GitCommit className="w-3 h-3" />}
                      >
                        Submit v{paper.currentVersion + 1}
                      </Button>

                      <Button
                        variant="secondary"
                        size="xs"
                        onClick={() => setSelectedPaperForHistory(paper)}
                        leftIcon={<History className="w-3 h-3" />}
                      >
                        Audit Trail
                      </Button>

                      <button
                        type="button"
                        onClick={() => toggleExpand(paper.id)}
                        className="px-2.5 py-1 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md border border-slate-200 transition-colors flex items-center gap-1"
                      >
                        <span>{isExpanded ? 'Hide Details' : 'View Reviews'}</span>
                        {isExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Expandable Drawer: Reviews & Integrity */}
                  {isExpanded && (
                    <div className="border-t border-slate-100 bg-slate-50/60 p-4 sm:p-5 space-y-4">
                      {/* Checksum & Proof Strip */}
                      {latestVer && (
                        <div className="bg-white p-3.5 rounded-lg border border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                          <div className="space-y-0.5">
                            <span className="text-[11px] font-medium text-slate-500">
                              Current Version SHA-256 Checksum:
                            </span>
                            <div className="font-mono text-slate-800 text-xs">
                              <HashViewer hash={latestVer.fileHash} type="fileHash" head={14} tail={12} />
                            </div>
                          </div>

                          <BlockchainBadge
                            verified={latestVer.verified}
                            blockNumber={latestVer.blockNumber}
                            onClick={() =>
                              setSelectedProofRecord({
                                paperId: paper.id,
                                version: latestVer.version,
                                fileHash: latestVer.fileHash,
                                txHash: latestVer.blockchainTxHash,
                                blockNumber: latestVer.blockNumber,
                                submittedAt: latestVer.submittedAt,
                                actorPseudonym: user?.pseudonymId,
                              })
                            }
                          />
                        </div>
                      )}

                      {/* Editorial Decision Remarks if made */}
                      {paper.decision?.remarks && (
                        <div className="p-3.5 bg-white rounded-lg border border-slate-200 space-y-1">
                          <div className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                            <Award className="w-4 h-4 text-emerald-600" />
                            <span>Official Editorial Decision Remarks:</span>
                          </div>
                          <p className="text-xs text-slate-700 leading-relaxed font-sans bg-slate-50 p-2.5 rounded border border-slate-100">
                            {paper.decision.remarks}
                          </p>
                        </div>
                      )}

                      {/* Anonymous Peer Evaluations */}
                      <div>
                        <div className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-2">
                          Double-Blind Peer Evaluations ({reviews.length})
                        </div>

                        {reviews.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {reviews.map((r, i) => (
                              <div
                                key={r.id || i}
                                className="p-3.5 bg-white rounded-lg border border-slate-200 space-y-2 text-xs"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-mono font-semibold text-slate-700">
                                    {r.reviewerPseudonym}
                                  </span>
                                  <Badge recommendation={r.recommendation} size="xs" />
                                </div>

                                <div className="grid grid-cols-4 gap-1 text-center py-1 text-[11px] bg-slate-50 rounded border border-slate-100">
                                  <div>
                                    <span className="text-slate-400 block text-[9px]">ORIG</span>
                                    <span className="font-bold text-slate-800">{r.scores.originality}/5</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-400 block text-[9px]">TECH</span>
                                    <span className="font-bold text-slate-800">{r.scores.technicalQuality}/5</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-400 block text-[9px]">CLAR</span>
                                    <span className="font-bold text-slate-800">{r.scores.clarity}/5</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-400 block text-[9px]">RELV</span>
                                    <span className="font-bold text-slate-800">{r.scores.relevance}/5</span>
                                  </div>
                                </div>

                                <p className="text-slate-700 italic leading-relaxed text-xs">
                                  "{r.authorComments}"
                                </p>

                                <div className="pt-1 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                                  <span>Submitted {formatDate(r.submittedAt)}</span>
                                  <BlockchainBadge verified={r.verified} blockNumber={r.blockNumber} size="xs" />
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-500 italic bg-white p-3 rounded-lg border border-slate-200">
                            Reviews are currently in progress. As reviewers submit evaluations, anonymized scores and constructive comments will appear here.
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      <UploadPaperModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={loadMySubmissions}
      />

      <UploadVersionModal
        isOpen={!!selectedPaperForVersion}
        onClose={() => setSelectedPaperForVersion(null)}
        paper={selectedPaperForVersion}
        onSuccess={loadMySubmissions}
      />

      <VersionHistoryModal
        isOpen={!!selectedPaperForHistory}
        onClose={() => setSelectedPaperForHistory(null)}
        paper={selectedPaperForHistory}
      />

      <TxExplorerModal
        isOpen={!!selectedProofRecord}
        onClose={() => setSelectedProofRecord(null)}
        record={selectedProofRecord}
      />
    </div>
  );
};
