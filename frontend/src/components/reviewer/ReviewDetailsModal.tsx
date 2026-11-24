import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Review } from '../../types';
import { formatDate } from '../../utils/formatters';
import { HashViewer } from '../blockchain/HashViewer';
import { BlockchainBadge } from '../blockchain/BlockchainBadge';
import { TxExplorerModal } from '../blockchain/TxExplorerModal';
import { Badge } from '../common/Badge';
import { FileCheck2, MessageSquare, Shield } from 'lucide-react';

interface ReviewDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  review: Review | null;
  paperTitle?: string;
}

export const ReviewDetailsModal: React.FC<ReviewDetailsModalProps> = ({
  isOpen,
  onClose,
  review,
  paperTitle,
}) => {
  const [showExplorer, setShowExplorer] = useState(false);

  if (!review) return null;

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={
          <div className="flex items-center gap-2">
            <FileCheck2 className="w-4 h-4 text-slate-700" />
            <span>Peer Review Record</span>
          </div>
        }
        subtitle={paperTitle ? `Manuscript: ${paperTitle}` : undefined}
        maxWidth="lg"
      >
        <div className="space-y-4 text-xs">
          {/* Header Summary */}
          <div className="bg-slate-50 border border-slate-200 rounded-md p-3.5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-[11px] text-slate-500 font-medium">Reviewer Signature:</span>
              <div className="font-mono font-medium text-slate-900 text-xs mt-0.5">
                {review.reviewerPseudonym}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge recommendation={review.recommendation} />
              <div className="bg-white border border-slate-200 text-slate-800 px-2.5 py-1 rounded text-xs font-mono font-semibold">
                Score: {review.overallScore.toFixed(1)} / 5.0
              </div>
            </div>
          </div>

          {/* Scores Breakdown */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="bg-white border border-slate-200 p-2.5 rounded-md text-center">
              <span className="text-[11px] text-slate-500 font-medium block mb-0.5">Originality</span>
              <span className="font-mono font-bold text-slate-900 text-sm">{review.scores.originality}/5</span>
            </div>
            <div className="bg-white border border-slate-200 p-2.5 rounded-md text-center">
              <span className="text-[11px] text-slate-500 font-medium block mb-0.5">Technical Rigor</span>
              <span className="font-mono font-bold text-slate-900 text-sm">
                {review.scores.technicalQuality}/5
              </span>
            </div>
            <div className="bg-white border border-slate-200 p-2.5 rounded-md text-center">
              <span className="text-[11px] text-slate-500 font-medium block mb-0.5">Clarity</span>
              <span className="font-mono font-bold text-slate-900 text-sm">{review.scores.clarity}/5</span>
            </div>
            <div className="bg-white border border-slate-200 p-2.5 rounded-md text-center">
              <span className="text-[11px] text-slate-500 font-medium block mb-0.5">Relevance</span>
              <span className="font-mono font-bold text-slate-900 text-sm">{review.scores.relevance}/5</span>
            </div>
          </div>

          {/* Author Feedback */}
          <div>
            <h4 className="font-semibold text-slate-800 mb-1 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
              <span>Feedback for Authors</span>
            </h4>
            <div className="bg-white border border-slate-200 rounded-md p-3.5 text-slate-700 leading-relaxed whitespace-pre-wrap font-sans text-xs">
              {review.authorComments}
            </div>
          </div>

          {review.confidentialComments && (
            <div>
              <h4 className="font-semibold text-slate-700 mb-1">Confidential Committee Remarks</h4>
              <div className="bg-slate-50 border border-slate-200 rounded-md p-3 text-slate-600 leading-relaxed whitespace-pre-wrap font-sans text-xs">
                {review.confidentialComments}
              </div>
            </div>
          )}

          {/* Blockchain Proof Section */}
          <div className="bg-slate-50 border border-slate-200 rounded-md p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-slate-500" />
                <span className="font-semibold text-slate-800">Cryptographic Integrity Hash</span>
              </div>
              <BlockchainBadge
                verified={review.verified}
                blockNumber={review.blockNumber}
                onClick={() => setShowExplorer(true)}
              />
            </div>
            <HashViewer hash={review.reviewHash} type="fileHash" head={12} tail={10} />
            <div className="text-[11px] text-slate-500 pt-1 flex items-center justify-between font-mono">
              <span>Timestamp: {formatDate(review.submittedAt)}</span>
              <span>Tx: {review.blockchainTxHash.slice(0, 10)}...</span>
            </div>
          </div>

          <div className="flex justify-end pt-2 border-t border-slate-100">
            <Button variant="secondary" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </Modal>

      <TxExplorerModal
        isOpen={showExplorer}
        onClose={() => setShowExplorer(false)}
        record={{
          paperId: review.paperId,
          fileHash: review.reviewHash,
          txHash: review.blockchainTxHash,
          blockNumber: review.blockNumber,
          submittedAt: review.submittedAt,
          actorPseudonym: review.reviewerPseudonym,
        }}
      />
    </>
  );
};
