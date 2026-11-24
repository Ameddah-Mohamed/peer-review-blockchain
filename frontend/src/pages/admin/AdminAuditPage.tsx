import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { mockAdapter } from '../../services/mockAdapter';
import { BlockchainEvent, BlockchainEventType } from '../../types';
import { Button } from '../../components/common/Button';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { HashViewer } from '../../components/blockchain/HashViewer';
import { TxExplorerModal } from '../../components/blockchain/TxExplorerModal';
import { formatDate } from '../../utils/formatters';
import {
  Search,
  RefreshCw,
  Cpu,
  Layers,
} from 'lucide-react';

export const AdminAuditPage: React.FC = () => {
  const [events, setEvents] = useState<BlockchainEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('all');
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

  useEffect(() => {
    loadAuditEvents();
  }, []);

  const loadAuditEvents = async () => {
    setIsLoading(true);
    try {
      const data = await adminService.getAuditTrail();
      setEvents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load audit events, falling back to mock events:', err);
      try {
        const fallback = await mockAdapter.getAuditTrail();
        setEvents(fallback);
      } catch (mockErr) {
        console.error('Mock fallback error:', mockErr);
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadAuditEvents();
  };

  const filteredEvents = events.filter((e) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      (e.paperId || '').toLowerCase().includes(q) ||
      (e.actorPseudonym || '').toLowerCase().includes(q) ||
      (e.txHash || '').toLowerCase().includes(q) ||
      (e.dataHash || '').toLowerCase().includes(q);
    const matchesType = eventTypeFilter === 'all' || e.eventType === eventTypeFilter;
    return matchesSearch && matchesType;
  });

  const getEventBadge = (type: BlockchainEventType) => {
    switch (type) {
      case 'PaperRegistered':
        return 'bg-sky-50 text-sky-800 border-sky-200';
      case 'ReviewerAssigned':
        return 'bg-slate-100 text-slate-800 border-slate-200';
      case 'ReviewSubmitted':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'DecisionRecorded':
        return 'bg-purple-50 text-purple-800 border-purple-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Immutable Smart Contract Ledger
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs text-slate-500 font-mono">
              {events.length} Sealed Blocks
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Cryptographic Audit Trail
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Tamper-evident, non-repudiation event stream containing timestamped SHA-256 manuscript fingerprints, reviewer allocations, and signed verdicts.
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
            Poll Blockchain
          </Button>
        </div>
      </div>

      {/* Node Status Banner */}
      <div className="bg-slate-900 text-white rounded-xl p-4 sm:p-5 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm">Hardhat EVM Localnet Node</span>
              <span className="text-[10px] font-mono bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded border border-emerald-800">
                Connected
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Gas limit: 30,000,000 • Chain ID: 31337 • Consensus: Proof-of-Authority
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6 text-xs font-mono">
          <div>
            <span className="text-slate-400 block text-[10px]">TOTAL EVENTS</span>
            <span className="font-bold text-white text-base tabular-nums">{events.length}</span>
          </div>
          <div className="border-l border-white/10 pl-6">
            <span className="text-slate-400 block text-[10px]">HEAD BLOCK</span>
            <span className="font-bold text-emerald-400 text-base tabular-nums">
              #{events[0]?.blockNumber || 104}
            </span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by paper ID, signer pseudonym, hash, or tx..."
            className="w-full text-xs pl-9 pr-3.5 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-slate-400 bg-slate-50/50"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-medium text-xs">Event:</span>
          <select
            value={eventTypeFilter}
            onChange={(e) => setEventTypeFilter(e.target.value)}
            className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:border-slate-400"
          >
            <option value="all">All Events ({events.length})</option>
            <option value="PaperRegistered">Paper Registered</option>
            <option value="ReviewerAssigned">Reviewer Assigned</option>
            <option value="ReviewSubmitted">Review Submitted</option>
            <option value="DecisionRecorded">Decision Recorded</option>
          </select>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
        {isLoading && events.length === 0 ? (
          <div className="py-12">
            <LoadingSpinner message="Scanning on-chain event logs..." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="modern-table">
              <thead>
                <tr>
                  <th className="w-24">Block</th>
                  <th>Event Type</th>
                  <th>Target Manuscript</th>
                  <th>Signer Pseudonym</th>
                  <th>Data Checksum</th>
                  <th>Transaction Receipt</th>
                  <th className="text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {filteredEvents.map((e) => (
                  <tr
                    key={e.id}
                    onClick={() =>
                      setSelectedEvent({
                        paperId: e.paperId,
                        version: e.version,
                        fileHash: e.dataHash,
                        txHash: e.txHash,
                        blockNumber: e.blockNumber,
                        submittedAt: e.timestamp,
                        actorPseudonym: e.actorPseudonym,
                      })
                    }
                    className="cursor-pointer hover:bg-slate-50/80 transition-colors group"
                  >
                    <td className="whitespace-nowrap font-mono text-xs font-semibold text-slate-700">
                      <div className="flex items-center gap-1.5">
                        <Cpu className="w-3.5 h-3.5 text-slate-400" />
                        <span>#{e.blockNumber}</span>
                      </div>
                    </td>

                    <td className="whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium border ${getEventBadge(
                          e.eventType
                        )}`}
                      >
                        {e.eventType}
                      </span>
                    </td>

                    <td className="whitespace-nowrap font-semibold text-xs text-slate-900">
                      <span>{e.paperId}</span>
                      {e.version ? (
                        <span className="text-[11px] font-mono text-slate-400 font-normal ml-1">
                          v{e.version}
                        </span>
                      ) : null}
                    </td>

                    <td className="whitespace-nowrap font-mono text-xs text-slate-700">
                      {e.actorPseudonym}
                    </td>

                    <td className="whitespace-nowrap" onClick={(ev) => ev.stopPropagation()}>
                      <HashViewer hash={e.dataHash} type="fileHash" head={8} tail={6} />
                    </td>

                    <td className="whitespace-nowrap" onClick={(ev) => ev.stopPropagation()}>
                      <HashViewer hash={e.txHash} type="txHash" head={8} tail={6} />
                    </td>

                    <td className="whitespace-nowrap text-right font-mono text-xs text-slate-500">
                      {formatDate(e.timestamp)}
                    </td>
                  </tr>
                ))}

                {filteredEvents.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-12">
                      <EmptyState
                        title="No on-chain events found"
                        description="Try adjusting your filter or check that the node is running."
                      />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Explorer Modal */}
      <TxExplorerModal
        isOpen={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
        record={selectedEvent}
      />
    </div>
  );
};
