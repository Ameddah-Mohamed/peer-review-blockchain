import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { paperService } from '../../services/paperService';
import { Paper } from '../../types';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Card, CardHeader, CardBody } from '../../components/common/Card';
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
  Clock,
  History,
  ShieldCheck,
  CheckCircle,
  GitCommit,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const AuthorDashboard: React.FC = () => {
  const { user } = useAuth();
  const [papers, setPapers] = useState<Paper[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
      setPapers(data);
    } catch (err) {
      console.error('Failed to load author submissions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Metrics
  const totalSubmissions = papers.length;
  const underReviewCount = papers.filter((p) => p.status === 'under_review').length;
  const acceptedCount = papers.filter((p) => p.status === 'accepted').length;
  const revisionsCount = papers.filter((p) => p.status === 'revision_requested').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-brand-950 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full text-xs font-medium text-brand-200 mb-2 border border-white/10 backdrop-blur-sm">
              <ShieldCheck className="w-3.5 h-3.5 text-brand-400" />
              <span>Author Workspace • Pseudonym: {user?.pseudonymId}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              My Research Submissions
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mt-1 leading-relaxed">
              Track manuscript versions, peer-review progress, and immutable proof-of-existence
              stamps recorded on the blockchain ledger.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link to="/verify">
              <Button
                variant="outline"
                size="md"
                className="bg-white/10 hover:bg-white/20 border-white/20 text-white"
                leftIcon={<ShieldCheck className="w-4 h-4 text-purple-400" />}
              >
                Verify Document
              </Button>
            </Link>
            <Button
              variant="primary"
              size="md"
              onClick={() => setIsUploadOpen(true)}
              leftIcon={<Upload className="w-4 h-4" />}
            >
              Submit New Paper
            </Button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Total Submitted
          </span>
          <div className="text-2xl font-bold text-slate-900">{totalSubmissions}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">Registered on ledger</span>
        </Card>

        <Card className="p-4">
          <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider block mb-1">
            Under Review
          </span>
          <div className="text-2xl font-bold text-blue-700">{underReviewCount}</div>
          <span className="text-[11px] text-blue-500/80 mt-1 block">In evaluation process</span>
        </Card>

        <Card className="p-4">
          <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider block mb-1">
            Accepted
          </span>
          <div className="text-2xl font-bold text-emerald-700">{acceptedCount}</div>
          <span className="text-[11px] text-emerald-500/80 mt-1 block">Decision confirmed</span>
        </Card>

        <Card className="p-4">
          <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider block mb-1">
            Revision Needed
          </span>
          <div className="text-2xl font-bold text-amber-700">{revisionsCount}</div>
          <span className="text-[11px] text-amber-500/80 mt-1 block">Action requested</span>
        </Card>
      </div>

      {/* Submissions List */}
      <Card>
        <CardHeader
          title="Submitted Manuscripts"
          description="Detailed version control, integrity checksums, and conference outcomes"
          action={
            <Button
              variant="ghost"
              size="sm"
              onClick={loadMySubmissions}
              className="text-xs"
            >
              Refresh
            </Button>
          }
        />

        <CardBody className="p-0">
          {isLoading ? (
            <LoadingSpinner message="Loading your submitted papers..." />
          ) : papers.length === 0 ? (
            <EmptyState
              title="No papers submitted yet"
              description="Upload your research manuscript in PDF format to initiate the double-blind peer-review lifecycle."
              actionText="Submit Your First Paper"
              onAction={() => setIsUploadOpen(true)}
            />
          ) : (
            <div className="divide-y divide-slate-100">
              {papers.map((paper) => {
                const latestVersion =
                  paper.versions?.find((v) => v.version === paper.currentVersion) ||
                  (paper.versions?.length ? paper.versions[paper.versions.length - 1] : null);
                return (
                  <div
                    key={paper.id}
                    className="p-5 sm:p-6 hover:bg-slate-50/50 transition-colors space-y-3.5"
                  >
                    {/* Top Row: Title, Status, Version */}
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
                        </div>
                        <h3 className="text-base font-semibold text-slate-900 pt-1 leading-snug">
                          {paper.title}
                        </h3>
                      </div>

                      {/* Blockchain status */}
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

                    {/* Abstract snippet */}
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {paper.abstract}
                    </p>

                    {/* Metadata & Hashes Row */}
                    <div className="flex flex-wrap items-center gap-y-2 gap-x-4 pt-1 text-xs text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>Submitted: {formatDate(latestVersion?.submittedAt)}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <GitCommit className="w-3.5 h-3.5 text-slate-400" />
                        <span>Current Version: v{paper.currentVersion}</span>
                      </div>

                      {latestVersion && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-400">SHA-256:</span>
                          <HashViewer hash={latestVersion.fileHash} type="fileHash" head={6} tail={4} />
                        </div>
                      )}
                    </div>

                    {/* Final Decision Box if available */}
                    {paper.decision && (
                      <div
                        className={`p-3.5 rounded-xl border text-xs space-y-1 ${
                          paper.decision.status === 'accepted'
                            ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                            : paper.decision.status === 'rejected'
                            ? 'bg-rose-50/70 border-rose-200 text-rose-950'
                            : 'bg-amber-50/70 border-amber-200 text-amber-950'
                        }`}
                      >
                        <div className="flex items-center justify-between font-semibold">
                          <span className="flex items-center gap-1.5">
                            <CheckCircle className="w-4 h-4 text-emerald-600" />
                            Final Decision: {paper.decision.status.toUpperCase()}
                          </span>
                          <span className="text-[11px] opacity-80">
                            {formatDate(paper.decision.decidedAt)}
                          </span>
                        </div>
                        <p className="text-xs pt-1 italic">"{paper.decision.remarks}"</p>
                      </div>
                    )}

                    {/* Actions row */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedPaperForHistory(paper)}
                          leftIcon={<History className="w-3.5 h-3.5" />}
                        >
                          Version History ({paper.versions.length})
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedPaperForVersion(paper)}
                          leftIcon={<Upload className="w-3.5 h-3.5" />}
                        >
                          Submit Revision
                        </Button>
                      </div>

                      <Link
                        to={`/verify?paperId=${paper.id}&hash=${latestVersion?.fileHash || ''}&version=${paper.currentVersion}`}
                        className="text-xs font-semibold text-purple-700 hover:text-purple-900 inline-flex items-center gap-1 hover:underline"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Verify on Blockchain
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardBody>
      </Card>

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
