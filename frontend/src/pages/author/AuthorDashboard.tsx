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
  ShieldCheck,
  CheckCircle,
  RefreshCw,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const AuthorDashboard: React.FC = () => {
  const { user } = useAuth();
  const [papers, setPapers] = useState<Paper[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

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

  // Metrics
  const totalSubmissions = papers.length;
  const underReviewCount = papers.filter((p) => p.status === 'under_review').length;
  const acceptedCount = papers.filter((p) => p.status === 'accepted').length;
  const revisionsCount = papers.filter((p) => p.status === 'revision_requested').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-slate-500 mb-1">
              <span>Author Workspace</span>
              <span>/</span>
              <span>Pseudonym: <strong className="text-slate-700">{user?.pseudonymId}</strong></span>
              <span>/</span>
              <span>Submissions</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              My Research Manuscripts
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Double-blind submissions, sequential version history, and cryptographic proof-of-existence stamps.
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
            <Link to="/verify">
              <Button variant="secondary" size="sm" leftIcon={<ShieldCheck className="w-3.5 h-3.5" />}>
                Verify Document
              </Button>
            </Link>
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
      </div>

      {/* Understated Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 border-b border-slate-200 pb-6">
        <div className="bg-white p-3.5 rounded-lg border border-slate-200">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Total Manuscripts
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">
            {totalSubmissions}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Committed on ledger</div>
        </div>

        <div className="bg-white p-3.5 rounded-lg border border-slate-200">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Under Review
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">
            {underReviewCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">In committee evaluation</div>
        </div>

        <div className="bg-white p-3.5 rounded-lg border border-slate-200">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Revisions Requested
          </div>
          <div className="text-2xl font-bold text-amber-700 mt-1 tabular-nums">
            {revisionsCount}
          </div>
          <div className="text-[11px] text-amber-600/80 mt-0.5">Action required</div>
        </div>

        <div className="bg-white p-3.5 rounded-lg border border-slate-200">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Accepted
          </div>
          <div className="text-2xl font-bold text-emerald-700 mt-1 tabular-nums">
            {acceptedCount}
          </div>
          <div className="text-[11px] text-emerald-600 mt-0.5">Cleared for publication</div>
        </div>
      </div>

      {/* Manuscripts Registry */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-700">
            Submitted Manuscripts ({papers.length})
          </h2>
        </div>

        {isLoading ? (
          <div className="py-12 bg-white rounded-lg border border-slate-200">
            <LoadingSpinner message="Loading manuscripts from blockchain ledger..." />
          </div>
        ) : papers.length === 0 ? (
          <div className="bg-white rounded-lg border border-slate-200 p-8">
            <EmptyState
              title="No manuscripts submitted yet"
              description="Upload your research manuscript in PDF format to register its cryptographic fingerprint and begin double-blind peer review."
              actionText="Submit Your First Paper"
              onAction={() => setIsUploadOpen(true)}
            />
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-slate-200 divide-y divide-slate-100 shadow-2xs">
            {papers.map((paper) => {
              const latestVersion =
                paper.versions?.find((v) => v.version === paper.currentVersion) ||
                (paper.versions?.length ? paper.versions[paper.versions.length - 1] : null);

              return (
                <div key={paper.id} className="p-5 sm:p-6 hover:bg-slate-50/50 transition-colors space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-semibold border border-slate-200">
                          {paper.id}
                        </span>
                        <span className="text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {paper.track}
                        </span>
                        <Badge status={paper.status} size="xs" />
                        <span className="text-xs font-mono text-slate-400">
                          v{paper.currentVersion}
                        </span>
                      </div>
                      <h3 className="text-base font-semibold text-slate-900 pt-1 leading-snug">
                        {paper.title}
                      </h3>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      {latestVersion && (
                        <BlockchainBadge
                          verified={latestVersion.verified}
                          blockNumber={latestVersion.blockNumber}
                          onClick={() =>
                            setSelectedProofRecord({
                              paperId: paper.id,
                              version: latestVersion.version,
                              fileHash: latestVersion.fileHash,
                              txHash: latestVersion.blockchainTxHash,
                              blockNumber: latestVersion.blockNumber,
                              submittedAt: latestVersion.submittedAt,
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

                  {/* Metadata and SHA-256 fingerprint */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500 pt-1">
                    <span className="tabular-nums">
                      Submitted: {formatDate(latestVersion?.submittedAt)}
                    </span>
                    <span>•</span>
                    <span className="tabular-nums">
                      Versions: {paper.versions?.length || 1}
                    </span>
                    {latestVersion && (
                      <>
                        <span>•</span>
                        <div className="inline-flex items-center gap-1.5">
                          <span className="text-slate-400 font-mono text-[10px]">SHA-256:</span>
                          <HashViewer hash={latestVersion.fileHash} type="fileHash" head={6} tail={4} />
                        </div>
                      </>
                    )}
                  </div>

                  {/* Editorial Decision Notice */}
                  {paper.decision && (
                    <div
                      className={`p-3 rounded border text-xs space-y-1 ${
                        paper.decision.status === 'accepted'
                          ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                          : paper.decision.status === 'rejected'
                          ? 'bg-rose-50/60 border-rose-200 text-rose-900'
                          : 'bg-amber-50/60 border-amber-200 text-amber-900'
                      }`}
                    >
                      <div className="flex items-center justify-between font-semibold">
                        <span className="flex items-center gap-1.5">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Editorial Decision: {paper.decision.status.toUpperCase()}</span>
                        </span>
                        <span className="text-[10px] opacity-75 font-mono tabular-nums">
                          {formatDate(paper.decision.decidedAt)}
                        </span>
                      </div>
                      <p className="text-xs italic pt-0.5">"{paper.decision.remarks}"</p>
                    </div>
                  )}

                  {/* Contextual Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="secondary"
                        size="xs"
                        onClick={() => setSelectedPaperForHistory(paper)}
                        leftIcon={<History className="w-3 h-3 text-slate-400" />}
                      >
                        Version History ({paper.versions?.length || 1})
                      </Button>

                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => setSelectedPaperForVersion(paper)}
                        leftIcon={<Upload className="w-3 h-3 text-slate-400" />}
                      >
                        Upload Revision
                      </Button>
                    </div>

                    <Link
                      to={`/verify?paperId=${paper.id}&hash=${latestVersion?.fileHash || ''}&version=${paper.currentVersion}`}
                      className="text-xs font-medium text-slate-600 hover:text-slate-900 inline-flex items-center gap-1 transition-colors"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
                      <span>Verify on Blockchain</span>
                    </Link>
                  </div>
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
