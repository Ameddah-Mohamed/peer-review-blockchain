import React from 'react';
import { Modal } from '../common/Modal';
import { HashViewer } from './HashViewer';
import { formatDate } from '../../utils/formatters';
import { ShieldCheck, Cpu, Key, Clock } from 'lucide-react';

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
        <div className="flex items-center gap-2 text-slate-900">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Blockchain Proof & Receipt</span>
        </div>
      }
      subtitle="Cryptographic state confirmation anchored on smart contract"
      maxWidth="lg"
    >
      <div className="space-y-4">
        {/* Confirmation banner */}
        <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 flex items-start gap-3">
          <div className="w-7 h-7 rounded-md bg-white border border-slate-200 flex items-center justify-center text-slate-700 shrink-0 mt-0.5">
            <Cpu className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-slate-900">
              Immutable Smart Contract Record
            </h4>
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
              This digital receipt is recorded on the EVM ledger. The cryptographic digest matches the digital document, guaranteeing integrity and non-repudiation.
            </p>
          </div>
        </div>

        {/* Details List */}
        <div className="bg-white rounded-lg border border-slate-200 divide-y divide-slate-100 text-xs">
          <div className="flex items-center justify-between p-3">
            <span className="text-slate-500 font-medium flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-slate-400" />
              <span>Block Height</span>
            </span>
            <span className="font-mono font-semibold text-slate-800 tabular-nums">
              Block #{record.blockNumber || '1'}
            </span>
          </div>

          <div className="flex items-center justify-between p-3">
            <span className="text-slate-500 font-medium flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Timestamp</span>
            </span>
            <span className="text-slate-700 tabular-nums font-mono">
              {formatDate(record.submittedAt)}
            </span>
          </div>

          {record.paperId && (
            <div className="flex items-center justify-between p-3">
              <span className="text-slate-500 font-medium">Target Manuscript</span>
              <span className="font-mono text-slate-800 font-medium">
                {record.paperId} {record.version ? `(v${record.version})` : ''}
              </span>
            </div>
          )}

          {record.actorPseudonym && (
            <div className="flex items-center justify-between p-3">
              <span className="text-slate-500 font-medium flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-slate-400" />
                <span>Signer Pseudonym</span>
              </span>
              <span className="font-mono bg-slate-50 text-slate-700 px-2 py-0.5 rounded border border-slate-200 font-semibold">
                {record.actorPseudonym}
              </span>
            </div>
          )}

          {record.fileHash && (
            <div className="p-3 space-y-1">
              <span className="text-slate-500 font-medium block">
                SHA-256 Document Checksum
              </span>
              <HashViewer hash={record.fileHash} type="fileHash" truncate={false} />
            </div>
          )}

          {record.txHash && (
            <div className="p-3 space-y-1">
              <span className="text-slate-500 font-medium block">
                Transaction Receipt (TxHash)
              </span>
              <HashViewer hash={record.txHash} type="txHash" truncate={false} />
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
