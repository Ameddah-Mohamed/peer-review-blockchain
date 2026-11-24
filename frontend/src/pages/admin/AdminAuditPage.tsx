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
        return 'bg-slate-100 text-slate-800 border-slate-200';
      case 'ReviewerAssigned':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'ReviewSubmitted':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'DecisionRecorded':
        return 'bg-purple-50 text-purple-800 border-purple-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
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
              <span>Ledger</span>
              <span>/</span>
              <span className="text-slate-800 font-medium">Audit Trail</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Blockchain Audit Trail
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Tamper-evident, cryptographically verified event stream of manuscript submissions, reviewer allocations, and final editorial decisions.
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
            placeholder="Search by Paper ID, signer pseudonym, transaction hash, or SHA-256..."
            className="w-full text-xs pl-8 pr-3 py-1.5 rounded-md border border-slate-200 focus:outline-none focus:border-slate-400 bg-slate-50/50"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <select
            value={eventTypeFilter}
            onChange={(e) => setEventTypeFilter(e.target.value)}
            className="text-xs px-2.5 py-1.5 rounded-md border border-slate-200 bg-white text-slate-700 focus:outline-none focus:border-slate-400"
          >
            <option value="all">All Event Types</option>
            <option value="PaperRegistered">PaperRegistered (Manuscript Commit)</option>
            <option value="ReviewerAssigned">ReviewerAssigned (Committee Allocation)</option>
            <option value="ReviewSubmitted">ReviewSubmitted (Evaluation Sealed)</option>
            <option value="DecisionRecorded">DecisionRecorded (Final Verdict)</option>
          </select>

          <span className="text-xs font-mono text-slate-400 pl-2 border-l border-slate-200 tabular-nums">
            {filteredEvents.length} {filteredEvents.length === 1 ? 'event' : 'events'}
          </span>
        </div>
      </div>

      {/* Academic Events Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-2xs">
        {isLoading ? (
          <div className="py-12">
            <LoadingSpinner message="Querying distributed ledger event logs..." />
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title="No blockchain events match your filter"
              description="Try adjusting your search criteria or reset event type filter."
              actionText="Reset Filters"
              onAction={() => {
                setSearchQuery('');
                setEventTypeFilter('all');
              }}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="academic-table">
              <thead>
                <tr>
                  <th className="w-20">Block</th>
                  <th>Event Type</th>
                  <th>Target Manuscript</th>
                  <th>Signer</th>
                  <th>Data Digest (SHA-256)</th>
                  <th>Transaction Receipt</th>
                  <th className="text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {filteredEvents.map((evt) => (
                  <tr
                    key={evt.id}
                    onClick={() =>
                      setSelectedEvent({
                        paperId: evt.paperId,
                        version: evt.version,
                        fileHash: evt.dataHash,
                        txHash: evt.txHash,
                        blockNumber: evt.blockNumber,
                        submittedAt: evt.timestamp,
                        actorPseudonym: evt.actorPseudonym,
                      })
                    }
                    className="cursor-pointer hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="font-mono text-xs font-semibold text-slate-700 whitespace-nowrap tabular-nums">
                      <span className="inline-flex items-center gap-1">
                        <Cpu className="w-3 h-3 text-slate-400" />
                        #{evt.blockNumber}
                      </span>
                    </td>

                    <td className="whitespace-nowrap">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium border ${getEventBadge(
                          evt.eventType
                        )}`}
                      >
                        {evt.eventType}
                      </span>
                    </td>

                    <td className="whitespace-nowrap">
                      <span className="font-mono text-xs text-slate-800">
                        {evt.paperId} {evt.version ? <span className="text-slate-400 font-normal">v{evt.version}</span> : ''}
                      </span>
                    </td>

                    <td className="font-mono text-xs text-slate-600 whitespace-nowrap">
                      {evt.actorPseudonym}
                    </td>

                    <td className="whitespace-nowrap">
                      <HashViewer hash={evt.dataHash} type="fileHash" head={6} tail={4} />
                    </td>

                    <td className="whitespace-nowrap">
                      <HashViewer hash={evt.txHash} type="txHash" head={6} tail={4} />
                    </td>

                    <td className="text-right text-xs text-slate-400 whitespace-nowrap tabular-nums">
                      {formatDate(evt.timestamp)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <TxExplorerModal
        isOpen={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
        record={selectedEvent}
      />
    </div>
  );
};
