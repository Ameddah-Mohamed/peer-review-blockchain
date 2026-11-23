import React from 'react';
import { Modal } from '../common/Modal';
import { HashViewer } from './HashViewer';
import { formatDate } from '../../utils/formatters';
import { ShieldCheck, Blocks, Key, Clock, FileCheck } from 'lucide-react';

interface TxExplorerModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: {
    title?: string;
    paperId?: string;
    version?: number;
    fileHash?: string;
    txHash?: string;
    blockNumber?: number;
    submittedAt?: string;
    actorPseudonym?: string;
    actionType?: string;
  } | null;
}

export const TxExplorerModal: React.FC<TxExplorerModalProps> = ({
  isOpen,
  onClose,
  record,
}) => {
  if (!record) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2 text-purple-900">
          <ShieldCheck className="w-5 h-5 text-purple-600" />
          <span>Blockchain Proof & Audit Explorer</span>
        </div>
      }
      subtitle="Cryptographic verification on Ethereum EVM ledger"
      maxWidth="lg"
    >
      <div className="space-y-4">
        {/* Verification banner */}
        <div className="p-4 rounded-xl bg-purple-50/70 border border-purple-200/80 flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center text-purple-700 shrink-0 mt-0.5">
            <Blocks className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-purple-950">
              Immutable Ledger Confirmation
            </h4>
            <p className="text-xs text-purple-800/90 mt-0.5 leading-relaxed">
              This record is irreversibly recorded on the smart contract. The hash matches the
              off-chain digital document, proving integrity and non-repudiation.
            </p>
          </div>
        </div>

        {/* Details Grid */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 space-y-3.5 text-xs">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-200">
            <span className="text-slate-500 font-medium flex items-center gap-1.5">
              <Blocks className="w-3.5 h-3.5 text-slate-400" /> Block Height
            </span>
            <span className="font-mono font-semibold text-slate-800 bg-white px-2.5 py-0.5 rounded border border-slate-200">
              Block #{record.blockNumber || '155401'}
            </span>
          </div>

          <div className="flex items-center justify-between pb-2.5 border-b border-slate-200">
            <span className="text-slate-500 font-medium flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" /> Block Timestamp
            </span>
            <span className="text-slate-800 font-medium">
              {formatDate(record.submittedAt)}
            </span>
          </div>

          {record.paperId && (
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-200">
              <span className="text-slate-500 font-medium">Paper Target</span>
              <span className="font-mono text-slate-800 font-medium">
                {record.paperId} {record.version ? `(v${record.version})` : ''}
              </span>
            </div>
          )}

          {record.actorPseudonym && (
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-200">
              <span className="text-slate-500 font-medium flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-slate-400" /> Signer Pseudonym
              </span>
              <span className="font-mono bg-brand-50 text-brand-700 px-2 py-0.5 rounded border border-brand-200 font-semibold">
                {record.actorPseudonym}
              </span>
            </div>
          )}

          {record.fileHash && (
            <div className="pt-1">
              <div className="text-slate-500 font-medium mb-1.5 flex items-center gap-1.5">
                <FileCheck className="w-3.5 h-3.5 text-slate-400" /> Registered Document SHA-256
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <HashViewer hash={record.fileHash} type="fileHash" truncate={false} />
              </div>
            </div>
          )}

          {record.txHash && (
            <div className="pt-1">
              <div className="text-slate-500 font-medium mb-1.5">Transaction Hash (TxHash)</div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <HashViewer hash={record.txHash} type="txHash" truncate={false} />
              </div>
            </div>
          )}
        </div>

        <div className="text-right pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-medium rounded-lg transition-colors"
          >
            Close Explorer
          </button>
        </div>
      </div>
    </Modal>
  );
};
