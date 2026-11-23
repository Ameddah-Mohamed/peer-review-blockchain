import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Paper, PaperVersion } from '../../types';
import { formatDate, formatFileSize } from '../../utils/formatters';
import { HashViewer } from '../blockchain/HashViewer';
import { BlockchainBadge } from '../blockchain/BlockchainBadge';
import { TxExplorerModal } from '../blockchain/TxExplorerModal';
import { History, FileText } from 'lucide-react';

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

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-brand-600" />
            <span>Version Audit History</span>
          </div>
        }
        subtitle={`${paper.title} (${paper.versions.length} registered version${paper.versions.length > 1 ? 's' : ''})`}
        maxWidth="lg"
      >
        <div className="space-y-4">
          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
            {paper.versions.map((ver: PaperVersion) => (
              <div key={ver.version} className="relative group">
                {/* Timeline node */}
                <div className="absolute -left-[19px] top-1.5 w-4 h-4 rounded-full bg-white border-2 border-brand-600 group-hover:scale-110 transition-transform shadow-xs" />

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 transition-all hover:border-slate-300 hover:shadow-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">
                        Version {ver.version}
                      </span>
                      {ver.version === paper.currentVersion && (
                        <span className="text-[10px] uppercase font-bold bg-brand-100 text-brand-800 px-2 py-0.5 rounded-full">
                          Latest / Active
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-500 font-medium">
                      {formatDate(ver.submittedAt)}
                    </span>
                  </div>

                  {ver.changeLog && (
                    <p className="text-xs text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200 mb-3 leading-relaxed italic">
                      "{ver.changeLog}"
                    </p>
                  )}

                  <div className="space-y-2 text-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <span className="text-slate-500 font-medium">SHA-256 Checksum:</span>
                      <HashViewer hash={ver.fileHash} type="fileHash" head={10} tail={8} />
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <span className="text-slate-500 font-medium">Transaction Proof:</span>
                      <HashViewer hash={ver.blockchainTxHash} type="txHash" head={10} tail={8} />
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-3 mt-3 border-t border-slate-200">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <FileText className="w-3.5 h-3.5 text-slate-400" />
                      <span>{ver.fileName || `paper_${paper.id}_v${ver.version}.pdf`}</span>
                      {ver.fileSize && <span>({formatFileSize(ver.fileSize)})</span>}
                    </div>

                    <div className="flex items-center gap-2">
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
              </div>
            ))}
          </div>

          <div className="text-right pt-2 border-t border-slate-100">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-medium rounded-lg transition-colors"
            >
              Close
            </button>
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
