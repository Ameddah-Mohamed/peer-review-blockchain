import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Review } from '../../types';
import { formatDate } from '../../utils/formatters';
import { HashViewer } from '../blockchain/HashViewer';
import { BlockchainBadge } from '../blockchain/BlockchainBadge';
import { TxExplorerModal } from '../blockchain/TxExplorerModal';
import { Badge } from '../common/Badge';
import { FileCheck2, Award, MessageSquare } from 'lucide-react';

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
            <FileCheck2 className="w-5 h-5 text-emerald-600" />
            <span>Peer Review Record</span>
          </div>
        }
        subtitle={paperTitle ? `Paper: ${paperTitle}` : undefined}
        maxWidth="lg"
      >
        <div className="space-y-4 text-xs">
          {/* Summary Header */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-slate-500 font-medium">Reviewer Signature:</span>
              <div className="font-mono font-bold text-slate-800 text-sm mt-0.5">
                {review.reviewerPseudonym}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge recommendation={review.recommendation} />
              <div className="bg-brand-50 border border-brand-200 text-brand-800 px-2.5 py-1 rounded-full font-bold flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-brand-600" />
                <span>Score: {review.overallScore.toFixed(1)} / 5.0</span>
              </div>
            </div>
          </div>

          {/* Scores Breakdown */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="bg-white border border-slate-200 p-2.5 rounded-lg text-center">
              <span className="text-slate-400 font-medium block mb-1">Originality</span>
              <span className="font-bold text-slate-800 text-sm">{review.scores.originality}/5</span>
            </div>
            <div className="bg-white border border-slate-200 p-2.5 rounded-lg text-center">
              <span className="text-slate-400 font-medium block mb-1">Tech Quality</span>
              <span className="font-bold text-slate-800 text-sm">
                {review.scores.technicalQuality}/5
              </span>
            </div>
            <div className="bg-white border border-slate-200 p-2.5 rounded-lg text-center">
              <span className="text-slate-400 font-medium block mb-1">Clarity</span>
              <span className="font-bold text-slate-800 text-sm">{review.scores.clarity}/5</span>
            </div>
            <div className="bg-white border border-slate-200 p-2.5 rounded-lg text-center">
              <span className="text-slate-400 font-medium block mb-1">Relevance</span>
              <span className="font-bold text-slate-800 text-sm">{review.scores.relevance}/5</span>
            </div>
          </div>

          {/* Written Comments */}
          <div>
            <h4 className="font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-slate-400" />
              <span>Feedback for Authors</span>
            </h4>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-slate-700 leading-relaxed whitespace-pre-wrap">
              {review.authorComments}
            </div>
          </div>

          {review.confidentialComments && (
            <div>
              <h4 className="font-bold text-amber-900 mb-1.5">Confidential Comments (Organizers only)</h4>
              <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3 text-amber-900 leading-relaxed whitespace-pre-wrap">
                {review.confidentialComments}
              </div>
            </div>
          )}

          {/* Blockchain Proof Section */}
          <div className="bg-purple-50/70 border border-purple-200/80 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-purple-950">Cryptographic Integrity Hash:</span>
              <BlockchainBadge
                verified={review.verified}
                blockNumber={review.blockNumber}
                onClick={() => setShowExplorer(true)}
              />
            </div>
            <HashViewer hash={review.reviewHash} type="fileHash" head={12} tail={10} />
            <div className="text-[11px] text-purple-700/80 pt-1 flex items-center justify-between">
              <span>Recorded: {formatDate(review.submittedAt)}</span>
              <span className="font-mono">Tx: {review.blockchainTxHash.slice(0, 10)}...</span>
            </div>
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
