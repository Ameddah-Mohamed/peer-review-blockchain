import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { mockAdapter } from '../../services/mockAdapter';
import { useAuth } from '../../context/AuthContext';
import { ConferenceStats, BlockchainEvent, Paper } from '../../types';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { TxExplorerModal } from '../../components/blockchain/TxExplorerModal';
import { formatDate } from '../../utils/formatters';
import { Link } from 'react-router-dom';
import {
  FileText,
  Users,
  ShieldCheck,
  ArrowRight,
  RefreshCw,
  Layers,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<ConferenceStats | null>(null);
  const [recentEvents, setRecentEvents] = useState<BlockchainEvent[]>([]);
  const [submissions, setSubmissions] = useState<Paper[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedProof, setSelectedProof] = useState<any>(null);

  useEffect(() => {
    loadOverviewData();
  }, [user]);

  const loadOverviewData = async () => {
    setIsLoading(true);
    let resolved = false;

    // Safety fallback timer ensures spinner NEVER gets stuck indefinitely
    const safetyTimer = setTimeout(async () => {
      if (!resolved) {
        console.warn('AdminDashboard loadOverviewData timed out, falling back to mock state');
        try {
          const fallbackStats = await mockAdapter.getAdminStats();
          const fallbackEvents = await mockAdapter.getAuditTrail();
          const fallbackPapers = await mockAdapter.getAllSubmissions();
          setStats(fallbackStats);
          setRecentEvents(fallbackEvents.slice(0, 6));
          setSubmissions(fallbackPapers);
        } catch {}
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }, 3500);

    try {
      const [overviewStats, events, papers] = await Promise.all([
        adminService.getOverview(),
        adminService.getAuditTrail(),
        adminService.getSubmissions(),
      ]);
      resolved = true;
      clearTimeout(safetyTimer);
      setStats(overviewStats || (await mockAdapter.getAdminStats()));
      setRecentEvents(Array.isArray(events) ? events.slice(0, 6) : []);
      setSubmissions(Array.isArray(papers) ? papers : []);
    } catch (err) {
      console.error('Failed to load admin stats, falling back to mock state:', err);
      try {
        const fallbackStats = await mockAdapter.getAdminStats();
        const fallbackEvents = await mockAdapter.getAuditTrail();
        const fallbackPapers = await mockAdapter.getAllSubmissions();
        setStats(fallbackStats);
        setRecentEvents(fallbackEvents.slice(0, 6));
        setSubmissions(fallbackPapers);
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
    loadOverviewData();
  };

  if (isLoading && !stats) {
    return <LoadingSpinner message="Synchronizing conference records & ledger blocks..." />;
  }

  if (!stats) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center space-y-4">
        <p className="text-slate-600 text-sm">Unable to connect to conference records.</p>
        <Button variant="secondary" size="sm" onClick={loadOverviewData}>
          Retry Connection
        </Button>
      </div>
    );
  }

  const reviewCompletionRate = stats.totalReviewsExpected
    ? Math.round((stats.totalReviewsCompleted / stats.totalReviewsExpected) * 100)
    : 0;

  return (
    <div className="space-y-7 max-w-7xl mx-auto">
      {/* Top Editorial Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-1">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              ICDS 2026 Governance
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs text-slate-500 font-mono">Consensus Node Active</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Conference Command Center
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Monitor real-time submission flow, committee review velocity, and immutable smart contract notarizations across all conference tracks.
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
            Sync State
          </Button>
          <Link to="/admin/submissions">
            <Button variant="secondary" size="sm">
              Reviewer Allocations
            </Button>
          </Link>
          <Link to="/admin/audit">
            <Button variant="primary" size="sm" leftIcon={<Layers className="w-3.5 h-3.5" />}>
              Ledger Explorer
            </Button>
          </Link>
        </div>
      </div>

      {/* Operations Velocity Strip (Integrated, not 4 floating cards!) */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
          {/* Submissions Volume */}
          <div className="p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Manuscripts Received</span>
              <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                Active Cycle
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold tracking-tight text-slate-900 tabular-nums">
                {stats.totalPapers}
              </span>
              <span className="text-xs text-slate-500">submissions</span>
            </div>
            <div className="flex items-center gap-2 pt-1 text-xs text-slate-500">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span>{stats.underReview} currently in peer review</span>
            </div>
          </div>

          {/* Review Velocity */}
          <div className="p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Evaluation Progress</span>
              <span className="text-xs font-mono font-semibold text-emerald-700">
                {reviewCompletionRate}%
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold tracking-tight text-slate-900 tabular-nums">
                {stats.totalReviewsCompleted}
              </span>
              <span className="text-xs text-slate-500">
                / {stats.totalReviewsExpected || stats.totalReviewsCompleted} completed
              </span>
            </div>
            {/* Visual Progress Meter */}
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-2">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${reviewCompletionRate}%` }}
              />
            </div>
          </div>

          {/* Decision Acceptance Rate */}
          <div className="p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Acceptance Rate</span>
              <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                {stats.totalPapers ? Math.round((stats.accepted / stats.totalPapers) * 100) : 0}% Yield
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold tracking-tight text-slate-900 tabular-nums">
                {stats.accepted}
              </span>
              <span className="text-xs text-slate-500">accepted manuscripts</span>
            </div>
            <div className="flex items-center gap-2 pt-1 text-xs text-slate-500">
              <span>{stats.totalReviewers} committee experts reviewing</span>
            </div>
          </div>

          {/* Blockchain Consensus Proofs */}
          <div className="p-5 space-y-2 bg-slate-50/50">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Immutable Ledger</span>
              <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-700 bg-emerald-100/60 px-1.5 py-0.5 rounded">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live EVM
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold tracking-tight text-slate-900 tabular-nums font-mono">
                #{stats.latestBlockNumber}
              </span>
              <span className="text-xs text-slate-500">block height</span>
            </div>
            <div className="flex items-center gap-2 pt-1 text-xs text-slate-600 font-mono">
              <span>{stats.blockchainEventsCount} verified events on chain</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Command Desk: 2-Column Composition */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column (2 Cols): Active Submissions Pipeline */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-700" />
              <h2 className="text-sm font-bold text-slate-900">
                Manuscript Submissions Pipeline
              </h2>
            </div>
            <Link
              to="/admin/submissions"
              className="text-xs font-medium text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-1 transition-colors"
            >
              <span>Manage all ({submissions.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Submissions Table with Distinctive Styling */}
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="modern-table">
                <thead>
                  <tr>
                    <th className="w-20">ID</th>
                    <th>Title & Track</th>
                    <th>Author Pseudonym</th>
                    <th>Status</th>
                    <th>Reviews In</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.slice(0, 6).map((paper) => {
                    const reviewCount = paper.completedReviewCount || 0;
                    const assignedCount = paper.assignedReviewerCount || 0;
                    const isFullyReviewed = assignedCount > 0 && reviewCount >= assignedCount;

                    return (
                      <tr key={paper.id} className="group">
                        <td className="font-mono text-xs font-semibold text-slate-600 whitespace-nowrap">
                          {paper.id}
                        </td>
                        <td>
                          <div
                            className="font-semibold text-slate-900 text-xs truncate max-w-xs group-hover:text-emerald-800 transition-colors"
                            title={paper.title}
                          >
                            {paper.title}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                            <span>{paper.track}</span>
                            <span className="text-slate-300">•</span>
                            <span className="font-mono text-slate-400">v{paper.currentVersion}</span>
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
                        <td className="whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`w-2 h-2 rounded-full ${
                                isFullyReviewed
                                  ? 'bg-emerald-500'
                                  : reviewCount > 0
                                  ? 'bg-amber-500'
                                  : 'bg-slate-300'
                              }`}
                            />
                            <span className="text-xs font-mono tabular-nums text-slate-700">
                              {reviewCount}/{assignedCount}
                            </span>
                          </div>
                        </td>
                        <td className="text-right whitespace-nowrap">
                          <Link to="/admin/submissions">
                            <button
                              type="button"
                              className="text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 px-2.5 py-1 rounded border border-slate-200 transition-colors"
                            >
                              Manage
                            </button>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                  {submissions.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-slate-400 text-xs">
                        No submissions recorded in this conference track yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <Link
              to="/admin/submissions"
              className="p-4 bg-white rounded-xl border border-slate-200/90 hover:border-slate-300 shadow-2xs transition-all block group"
            >
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold text-slate-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  <span>Assign Reviewers & Finalize Decisions</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </div>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Allocate committee members, verify double-blind anonymity guarantees, and record immutable verdicts.
              </p>
            </Link>

            <Link
              to="/admin/users"
              className="p-4 bg-white rounded-xl border border-slate-200/90 hover:border-slate-300 shadow-2xs transition-all block group"
            >
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold text-slate-900 flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-600" />
                  <span>Program Committee Directory</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </div>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Review verified academic affiliations, reviewer workloads, and cryptographically derived pseudonyms.
              </p>
            </Link>
          </div>
        </div>

        {/* Right Column (1 Col): Live Blockchain Audit Stream */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-slate-700" />
              <h2 className="text-sm font-bold text-slate-900">
                On-Chain Notarization Feed
              </h2>
            </div>
            <Link
              to="/admin/audit"
              className="text-xs font-medium text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-1 transition-colors"
            >
              <span>Ledger trail</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs divide-y divide-slate-100 overflow-hidden">
            {recentEvents.map((evt) => (
              <div
                key={evt.id}
                onClick={() =>
                  setSelectedProof({
                    paperId: evt.paperId,
                    version: evt.version,
                    fileHash: evt.dataHash,
                    txHash: evt.txHash,
                    blockNumber: evt.blockNumber,
                    submittedAt: evt.timestamp,
                    actorPseudonym: evt.actorPseudonym,
                  })
                }
                className="p-3.5 hover:bg-slate-50/80 transition-colors cursor-pointer space-y-2 group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {evt.eventType}
                  </span>
                  <span className="font-mono text-xs font-medium text-slate-500 tabular-nums">
                    Block #{evt.blockNumber}
                  </span>
                </div>

                <div className="text-xs font-medium text-slate-900 truncate">
                  Target: <span className="font-semibold">{evt.paperId}</span>{' '}
                  {evt.version ? `(v${evt.version})` : ''}
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                  <span>Signer: {evt.actorPseudonym}</span>
                  <span className="tabular-nums">{formatDate(evt.timestamp)}</span>
                </div>
              </div>
            ))}

            {recentEvents.length === 0 && (
              <div className="p-8 text-center text-xs text-slate-400">
                No on-chain ledger events recorded yet.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Transaction Proof Modal */}
      <TxExplorerModal
        isOpen={!!selectedProof}
        onClose={() => setSelectedProof(null)}
        record={selectedProof}
      />
    </div>
  );
};
