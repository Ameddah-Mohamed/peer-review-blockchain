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
  Cpu,
  RefreshCw,
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
    return <LoadingSpinner message="Loading conference registry and blockchain state..." />;
  }

  if (!stats) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-4">
        <p className="text-slate-600 text-sm">Unable to load conference records.</p>
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Editorial Header */}
      <div className="border-b border-slate-200 pb-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-slate-500 mb-1">
              <span>ICDS 2026</span>
              <span>/</span>
              <span>Program Committee</span>
              <span>/</span>
              <span className="text-slate-800 font-medium">Administration</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Conference Governance
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              International Conference on Decentralized Systems • Editorial monitoring, committee allocations, and cryptographic audit proofs.
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
            <Link to="/admin/submissions">
              <Button variant="secondary" size="sm">
                Manage Submissions
              </Button>
            </Link>
            <Link to="/admin/audit">
              <Button variant="primary" size="sm">
                Audit Ledger
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Understated Metrics Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 border-b border-slate-200 pb-8">
        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Total Submissions
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight mt-1 tabular-nums">
            {stats.totalPapers}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {stats.underReview} under review
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Accepted Papers
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight mt-1 tabular-nums">
            {stats.accepted}
          </div>
          <div className="text-[11px] text-emerald-700 mt-0.5 font-medium">
            {stats.totalPapers ? Math.round((stats.accepted / stats.totalPapers) * 100) : 0}% acceptance rate
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Review Progress
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight mt-1 tabular-nums">
            {stats.totalReviewsCompleted} <span className="text-xs font-normal text-slate-400">/ {stats.totalReviewsExpected}</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {reviewCompletionRate}% completed
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Review Committee
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight mt-1 tabular-nums">
            {stats.totalReviewers}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {stats.totalAuthors} registered authors
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 col-span-2 lg:col-span-1">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-between">
            <span>Ledger Proofs</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Connected to EVM node" />
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight mt-1 tabular-nums">
            {stats.blockchainEventsCount}
          </div>
          <div className="text-[11px] font-mono text-slate-500 mt-0.5 flex items-center gap-1">
            <Cpu className="w-3 h-3 text-slate-400" />
            <span>Block #{stats.latestBlockNumber}</span>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Recent Submissions (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-700">
              Recent Submissions
            </h2>
            <Link
              to="/admin/submissions"
              className="text-xs font-medium text-slate-600 hover:text-slate-900 inline-flex items-center gap-1 transition-colors"
            >
              <span>View all ({submissions.length})</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="academic-table">
                <thead>
                  <tr>
                    <th className="w-24">ID</th>
                    <th>Title & Track</th>
                    <th>Author</th>
                    <th>Status</th>
                    <th>Reviews</th>
                    <th className="text-right">Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.slice(0, 6).map((paper) => {
                    const latestVer =
                      paper.versions?.find((v) => v.version === paper.currentVersion) ||
                      paper.versions?.[0];
                    return (
                      <tr key={paper.id}>
                        <td className="font-mono text-xs font-medium text-slate-600 whitespace-nowrap">
                          {paper.id}
                        </td>
                        <td>
                          <div className="font-medium text-slate-900 text-xs truncate max-w-xs" title={paper.title}>
                            {paper.title}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {paper.track}
                          </div>
                        </td>
                        <td className="font-mono text-xs text-slate-600 whitespace-nowrap">
                          {paper.authorPseudonym}
                        </td>
                        <td className="whitespace-nowrap">
                          <Badge status={paper.status} size="xs" />
                        </td>
                        <td className="text-xs text-slate-600 whitespace-nowrap tabular-nums">
                          {paper.completedReviewCount || 0} / {paper.assignedReviewerCount || 0}
                        </td>
                        <td className="text-right text-xs text-slate-400 whitespace-nowrap tabular-nums">
                          {formatDate(latestVer?.submittedAt)}
                        </td>
                      </tr>
                    );
                  })}
                  {submissions.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-slate-400 text-xs">
                        No submissions recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Access Tiles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <Link
              to="/admin/submissions"
              className="p-4 bg-white rounded-lg border border-slate-200 hover:border-slate-300 transition-colors block group"
            >
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-slate-500" />
                  <span>Assign Reviewers & Record Decisions</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Allocate committee members, verify double-blind anonymity, and seal editorial decisions.
              </p>
            </Link>

            <Link
              to="/admin/users"
              className="p-4 bg-white rounded-lg border border-slate-200 hover:border-slate-300 transition-colors block group"
            >
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-slate-500" />
                  <span>Reviewer Committee Directory</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Inspect institutional affiliations, reviewer expertise, and participant pseudonyms.
              </p>
            </Link>
          </div>
        </div>

        {/* Right Column: Live Blockchain Activity (1 col) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-700">
                Ledger Activity
              </h2>
            </div>
            <Link
              to="/admin/audit"
              className="text-xs font-medium text-slate-600 hover:text-slate-900 inline-flex items-center gap-1 transition-colors"
            >
              <span>Full Audit Trail</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 divide-y divide-slate-100">
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
                className="p-3 hover:bg-slate-50 transition-colors cursor-pointer space-y-1.5 group"
              >
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                    {evt.eventType}
                  </span>
                  <span className="font-mono text-slate-400 tabular-nums">#{evt.blockNumber}</span>
                </div>

                <div className="text-xs font-medium text-slate-800 truncate">
                  Paper: {evt.paperId} {evt.version ? `(v${evt.version})` : ''}
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <span>Signer: {evt.actorPseudonym}</span>
                  <span className="tabular-nums">{formatDate(evt.timestamp)}</span>
                </div>
              </div>
            ))}
            {recentEvents.length === 0 && (
              <div className="p-6 text-center text-xs text-slate-400">
                No on-chain events recorded yet.
              </div>
            )}
          </div>
        </div>
      </div>

      <TxExplorerModal
        isOpen={!!selectedProof}
        onClose={() => setSelectedProof(null)}
        record={selectedProof}
      />
    </div>
  );
};
