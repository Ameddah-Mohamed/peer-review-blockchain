import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { BlockchainEvent, BlockchainEventType } from '../../types';
import { Button } from '../../components/common/Button';
import { Card, CardHeader, CardBody } from '../../components/common/Card';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { HashViewer } from '../../components/blockchain/HashViewer';
import { TxExplorerModal } from '../../components/blockchain/TxExplorerModal';
import { formatDate } from '../../utils/formatters';
import {
  Blocks,
  Search,
} from 'lucide-react';

export const AdminAuditPage: React.FC = () => {
  const [events, setEvents] = useState<BlockchainEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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
      setEvents(data);
    } catch (err) {
      console.error('Failed to load audit events:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredEvents = events.filter((e) => {
    const matchesSearch =
      e.paperId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.actorPseudonym.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.txHash.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.dataHash.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = eventTypeFilter === 'all' || e.eventType === eventTypeFilter;
    return matchesSearch && matchesType;
  });

  const getEventBadge = (type: BlockchainEventType) => {
    switch (type) {
      case 'PaperRegistered':
        return 'bg-brand-100 text-brand-800 border-brand-200';
      case 'ReviewerAssigned':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'ReviewSubmitted':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'DecisionRecorded':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full mb-1">
            <Blocks className="w-3.5 h-3.5" />
            <span>Immutable Distributed Ledger Records</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Blockchain Audit Trail & Proofs
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Tamper-evident logs of every paper version, reviewer assignment, peer review, and
            decision.
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={loadAuditEvents}>
          Refresh Ledger State
        </Button>
      </div>

      {/* Filter and Search */}
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Paper ID, Signer Pseudonym, TxHash, or SHA-256..."
              className="w-full text-xs pl-9 pr-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          <div>
            <select
              value={eventTypeFilter}
              onChange={(e) => setEventTypeFilter(e.target.value)}
              className="w-full text-xs px-3 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-white"
            >
              <option value="all">All Blockchain Event Types</option>
              <option value="PaperRegistered">PaperRegistered (Manuscript Commit)</option>
              <option value="ReviewerAssigned">ReviewerAssigned (Committee Allocation)</option>
              <option value="ReviewSubmitted">ReviewSubmitted (Evaluation Sealed)</option>
              <option value="DecisionRecorded">DecisionRecorded (Final Verdict)</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Audit Events Table */}
      <Card>
        <CardHeader
          title={`On-Chain Events (${filteredEvents.length})`}
          description="Click any row to inspect complete cryptographic block receipts"
        />

        <CardBody className="p-0">
          {isLoading ? (
            <LoadingSpinner message="Querying blockchain events..." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4">Event</th>
                    <th className="py-3 px-4">Block Height</th>
                    <th className="py-3 px-4">Target Paper</th>
                    <th className="py-3 px-4">Signer Pseudonym</th>
                    <th className="py-3 px-4">Payload / Data Hash</th>
                    <th className="py-3 px-4">Transaction Hash</th>
                    <th className="py-3 px-4">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
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
                      className="hover:bg-purple-50/40 transition-colors cursor-pointer"
                    >
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full font-bold border text-[11px] ${getEventBadge(
                            evt.eventType
                          )}`}
                        >
                          {evt.eventType}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-purple-700">
                        #{evt.blockNumber}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-mono bg-slate-100 text-slate-800 px-2 py-0.5 rounded font-semibold border border-slate-200">
                          {evt.paperId} {evt.version ? `(v${evt.version})` : ''}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-slate-700">
                        {evt.actorPseudonym}
                      </td>

                      <td className="py-3.5 px-4">
                        <HashViewer hash={evt.dataHash} type="fileHash" head={6} tail={4} />
                      </td>

                      <td className="py-3.5 px-4">
                        <HashViewer hash={evt.txHash} type="txHash" head={6} tail={4} />
                      </td>

                      <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                        {formatDate(evt.timestamp)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      <TxExplorerModal
        isOpen={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
        record={selectedEvent}
      />
    </div>
  );
};
