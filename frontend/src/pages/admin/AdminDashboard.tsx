import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { ConferenceStats, BlockchainEvent, Paper } from '../../types';
import { Card, CardHeader, CardBody } from '../../components/common/Card';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Badge } from '../../components/common/Badge';
import { TxExplorerModal } from '../../components/blockchain/TxExplorerModal';
import { formatDate } from '../../utils/formatters';
import { Link } from 'react-router-dom';
import {
  FileText,
  Users,
  Award,
  ShieldCheck,
  Blocks,
  ArrowRight,
  Cpu,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<ConferenceStats | null>(null);
  const [recentEvents, setRecentEvents] = useState<BlockchainEvent[]>([]);
  const [submissions, setSubmissions] = useState<Paper[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProof, setSelectedProof] = useState<any>(null);

  useEffect(() => {
    loadOverviewData();
  }, []);

  const loadOverviewData = async () => {
    setIsLoading(true);
    try {
      const [overviewStats, events, papers] = await Promise.all([
        adminService.getOverview(),
        adminService.getAuditTrail(),
        adminService.getSubmissions(),
      ]);
      setStats(overviewStats);
      setRecentEvents(events.slice(0, 5));
      setSubmissions(papers);
    } catch (err) {
      console.error('Failed to load admin stats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !stats) {
    return <LoadingSpinner message="Loading conference analytics & blockchain state..." />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-purple-500/20 px-3 py-1 rounded-full text-xs font-medium text-purple-300 mb-2 border border-purple-500/30 backdrop-blur-sm">
              <Blocks className="w-3.5 h-3.5 text-purple-400" />
              <span>Smart Contract Verified • Block Height: #{stats.latestBlockNumber}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              Conference Administration & Governance
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mt-1 leading-relaxed">
              Real-time oversight of manuscript submissions, double-blind committee assignments,
              review completion rates, and tamper-evident blockchain audit events.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              to="/admin/submissions"
              className="px-4 py-2 bg-white text-slate-900 hover:bg-slate-100 text-xs font-semibold rounded-lg shadow-sm transition-all"
            >
              Manage Papers
            </Link>
            <Link
              to="/admin/audit"
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
            >
              Audit Ledger
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Submissions</span>
            <FileText className="w-4 h-4 text-brand-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{stats.totalPapers}</div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
            <span className="text-emerald-600 font-semibold">{stats.accepted} accepted</span>
            <span>•</span>
            <span className="text-blue-600 font-semibold">{stats.underReview} reviewing</span>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Review Committee</span>
            <Users className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{stats.totalReviewers}</div>
          <div className="text-[11px] text-slate-400 mt-1">
            {stats.totalAuthors} registered authors
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Reviews Progress</span>
            <Award className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {stats.totalReviewsCompleted} / {stats.totalReviewsExpected}
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1">
            {Math.round((stats.totalReviewsCompleted / Math.max(stats.totalReviewsExpected, 1)) * 100)}%
            completion rate
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Blockchain Proofs</span>
            <Blocks className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{stats.blockchainEventsCount}</div>
          <div className="text-[11px] text-purple-600 font-mono mt-1 flex items-center gap-1">
            <Cpu className="w-3 h-3" />
            <span>Block #{stats.latestBlockNumber}</span>
          </div>
        </Card>
      </div>

      {/* Main Sections Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recent Submissions Overview (2 spans) */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader
              title="Recent Submissions"
              description="Overview of conference papers and current evaluation stage"
              action={
                <Link
                  to="/admin/submissions"
                  className="text-xs font-semibold text-brand-600 hover:text-brand-800 flex items-center gap-1"
                >
                  View all ({submissions.length}) <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              }
            />

            <CardBody className="p-0">
              <div className="divide-y divide-slate-100">
                {submissions.slice(0, 4).map((paper) => (
                  <div key={paper.id} className="p-4 hover:bg-slate-50/50 transition-colors flex items-center justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded font-semibold">
                          {paper.id}
                        </span>
                        <Badge status={paper.status} size="sm" />
                        <span className="font-mono text-[11px] text-slate-400">
                          {paper.authorPseudonym}
                        </span>
                      </div>
                      <h4 className="text-xs sm:text-sm font-semibold text-slate-900 truncate">
                        {paper.title}
                      </h4>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[11px] text-slate-500 block">
                        {paper.completedReviewCount || 0} / {paper.assignedReviewerCount || 0} reviews
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {formatDate(paper.versions[0]?.submittedAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          {/* Quick Action Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              to="/admin/submissions"
              className="p-5 bg-white rounded-xl border border-slate-200 hover:border-brand-500 hover:shadow-sm transition-all group block"
            >
              <FileText className="w-6 h-6 text-brand-600 mb-2 group-hover:scale-110 transition-transform" />
              <h4 className="text-sm font-semibold text-slate-900">Manage Submissions & Assign</h4>
              <p className="text-xs text-slate-500 mt-1">
                Allocate expert reviewers, enforce double-blind standards, and monitor feedback.
              </p>
            </Link>

            <Link
              to="/admin/users"
              className="p-5 bg-white rounded-xl border border-slate-200 hover:border-emerald-500 hover:shadow-sm transition-all group block"
            >
              <Users className="w-6 h-6 text-emerald-600 mb-2 group-hover:scale-110 transition-transform" />
              <h4 className="text-sm font-semibold text-slate-900">Manage Users & Permissions</h4>
              <p className="text-xs text-slate-500 mt-1">
                View participant pseudonyms, institutional affiliations, and assign committee roles.
              </p>
            </Link>
          </div>
        </div>

        {/* Right Column: Immutable Audit Ledger Stream */}
        <div>
          <Card className="h-full">
            <CardHeader
              title={
                <div className="flex items-center gap-1.5 text-purple-900">
                  <ShieldCheck className="w-4 h-4 text-purple-600" />
                  <span>Blockchain Activity</span>
                </div>
              }
              description="Recent on-chain state commits"
              action={
                <Link
                  to="/admin/audit"
                  className="text-xs font-semibold text-purple-700 hover:text-purple-900"
                >
                  Full Trail
                </Link>
              }
            />

            <CardBody className="p-0">
              <div className="divide-y divide-slate-100">
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
                    className="p-3.5 hover:bg-purple-50/40 transition-colors cursor-pointer space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-purple-800 bg-purple-100/70 px-2 py-0.5 rounded-full">
                        {evt.eventType}
                      </span>
                      <span className="font-mono text-slate-400">#{evt.blockNumber}</span>
                    </div>

                    <div className="text-xs font-medium text-slate-700 truncate">
                      Target: {evt.paperId} {evt.version ? `(v${evt.version})` : ''}
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                      <span>Signer: {evt.actorPseudonym}</span>
                      <span>{formatDate(evt.timestamp)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
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
