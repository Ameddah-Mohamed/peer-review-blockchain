import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Paper, PaperVersion } from '../../types';
import { formatDate, formatFileSize } from '../../utils/formatters';
import { HashViewer } from '../blockchain/HashViewer';
import { BlockchainBadge } from '../blockchain/BlockchainBadge';
import { TxExplorerModal } from '../blockchain/TxExplorerModal';
import { History, FileText, Check } from 'lucide-react';

interface VersionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  paper: Paper | null;
}

export const VersionHistoryModal: React.FC<VersionHistoryModalProps> = ({
  isOpen,
  onClose,
  paper,
}) => {
  const [selectedProof, setSelectedProof] = useState<any>(null);

  if (!paper) return null;

  const sortedVersions = [...(paper.versions || [])].sort((a, b) => b.version - a.version);

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-slate-700" />
            <span>Version Audit Ledger</span>
          </div>
        }
        subtitle={`${paper.title} • ${sortedVersions.length} recorded revision${sortedVersions.length > 1 ? 's' : ''}`}
        maxWidth="lg"
      >
        <div className="space-y-4">
          <div className="relative pl-5 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-slate-200">
            {sortedVersions.map((ver: PaperVersion) => {
              const isCurrent = ver.version === paper.currentVersion;
              return (
                <div key={ver.version} className="relative group">
                  {/* Timeline node */}
                  <div
                    className={`absolute -left-[17px] top-1.5 w-3 h-3 rounded-full border-2 ${
                      isCurrent
                        ? 'bg-slate-900 border-slate-900'
                        : 'bg-white border-slate-400'
                    }`}
                  />

                  <div className="bg-white border border-slate-200 rounded-md p-4 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 text-xs">
                          Revision {ver.version}
                        </span>
                        {isCurrent && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded border border-slate-200">
                            <Check className="w-3 h-3 text-emerald-600" />
                            Current Head
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {formatDate(ver.submittedAt)}
                      </span>
                    </div>

                    {ver.changeLog && (
                      <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded border border-slate-200/80 leading-relaxed font-sans">
                        {ver.changeLog}
                      </p>
                    )}

                    <div className="space-y-1.5 text-xs">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px]">
                        <span className="text-slate-500 font-medium">SHA-256 Digest:</span>
                        <HashViewer hash={ver.fileHash} type="fileHash" head={10} tail={8} />
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px]">
                        <span className="text-slate-500 font-medium">Ledger Tx:</span>
                        <HashViewer hash={ver.blockchainTxHash} type="txHash" head={10} tail={8} />
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-slate-100">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <FileText className="w-3.5 h-3.5 text-slate-400" />
                        <span className="truncate max-w-[200px] sm:max-w-[280px]">
                          {ver.fileName || `paper_${paper.id}_v${ver.version}.pdf`}
                        </span>
                        {ver.fileSize && (
                          <span className="text-slate-400 font-mono">({formatFileSize(ver.fileSize)})</span>
                        )}
                      </div>

                      <BlockchainBadge
                        verified={ver.verified}
                        blockNumber={ver.blockNumber}
                        onClick={() =>
                          setSelectedProof({
                            paperId: paper.id,
                            version: ver.version,
                            fileHash: ver.fileHash,
                            txHash: ver.blockchainTxHash,
                            blockNumber: ver.blockNumber,
                            submittedAt: ver.submittedAt,
                            actorPseudonym: paper.authorPseudonym,
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-100">
            <Button variant="secondary" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </Modal>

      {/* Embedded Proof Explorer Modal */}
      <TxExplorerModal
        isOpen={!!selectedProof}
        onClose={() => setSelectedProof(null)}
        record={selectedProof}
      />
    </>
  );
};
