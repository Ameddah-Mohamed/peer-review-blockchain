import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { adminService } from '../../services/adminService';
import { useNotification } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import { Paper } from '../../types';
import { CheckCircle2, XCircle, RotateCcw, Award } from 'lucide-react';
import { Badge } from '../common/Badge';

interface MakeDecisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  paper: Paper | null;
  onSuccess: () => void;
}

export const MakeDecisionModal: React.FC<MakeDecisionModalProps> = ({
  isOpen,
  onClose,
  paper,
  onSuccess,
}) => {
  const { user } = useAuth();
  const { showToast } = useNotification();

  const [decision, setDecision] = useState<'accepted' | 'rejected' | 'revision_requested'>('accepted');
  const [remarks, setRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!paper) return null;

  const reviews = paper.reviews || [];
  const averageScore =
    reviews.length > 0
      ? (reviews.reduce((acc, r) => acc + r.overallScore, 0) / reviews.length).toFixed(1)
      : 'N/A';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !paper) return;
    if (!remarks.trim()) {
      showToast('warning', 'Missing Remarks', 'Please provide official decision remarks.');
      return;
    }

    setIsSubmitting(true);
    try {
      await adminService.makeDecision(paper.id, decision, remarks, user);
      showToast(
        'success',
        'Decision Recorded On-Chain',
        `Final conference decision recorded and signed on blockchain.`
      );
      onSuccess();
      onClose();
    } catch (err: any) {
      showToast('error', 'Decision Error', err.message || 'Failed to record decision.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Editorial Decision"
      subtitle={`Manuscript: ${paper.title}`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Peer Reviews Summary Box */}
        <div className="bg-slate-50 border border-slate-200 rounded-md p-3.5 space-y-2 text-xs">
          <div className="flex items-center justify-between font-medium text-slate-800">
            <span>Committee Reviews ({reviews.length} completed):</span>
            <span className="font-mono bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-900 font-semibold">
              Mean Score: {averageScore} / 5.0
            </span>
          </div>

          {reviews.length > 0 ? (
            <div className="space-y-1.5 pt-1">
              {reviews.map((r, i) => (
                <div
                  key={r.id || i}
                  className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded border border-slate-200"
                >
                  <span className="font-mono text-slate-700 text-[11px]">{r.reviewerPseudonym}</span>
                  <div className="flex items-center gap-2">
                    <Badge recommendation={r.recommendation} size="sm" />
                    <span className="font-mono font-bold text-slate-800 text-[11px]">
                      {r.overallScore.toFixed(1)}/5
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 italic py-1 text-[11px]">No peer reviews completed yet.</p>
          )}
        </div>

        {/* Decision Selection */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Final Editorial Verdict <span className="text-rose-500">*</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setDecision('accepted')}
              className={`p-2.5 rounded-md border text-center transition-colors flex flex-col items-center gap-1 ${
                decision === 'accepted'
                  ? 'bg-emerald-50 border-emerald-600 text-emerald-900 font-medium'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span className="text-xs">Accept</span>
            </button>

            <button
              type="button"
              onClick={() => setDecision('revision_requested')}
              className={`p-2.5 rounded-md border text-center transition-colors flex flex-col items-center gap-1 ${
                decision === 'revision_requested'
                  ? 'bg-amber-50 border-amber-600 text-amber-900 font-medium'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <RotateCcw className="w-4 h-4 text-amber-600" />
              <span className="text-xs">Revision</span>
            </button>

            <button
              type="button"
              onClick={() => setDecision('rejected')}
              className={`p-2.5 rounded-md border text-center transition-colors flex flex-col items-center gap-1 ${
                decision === 'rejected'
                  ? 'bg-rose-50 border-rose-600 text-rose-900 font-medium'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <XCircle className="w-4 h-4 text-rose-600" />
              <span className="text-xs">Reject</span>
            </button>
          </div>
        </div>

        {/* Remarks */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Official Editorial Remarks & Instructions <span className="text-rose-500">*</span>
          </label>
          <textarea
            required
            rows={4}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Official rationale and guidance sent to the author and permanently sealed on the blockchain ledger..."
            className="w-full text-xs p-3 rounded-md border border-slate-300 focus:outline-none focus:border-slate-900 transition-colors bg-white font-sans text-slate-900 placeholder:text-slate-400"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <Button variant="outline" size="sm" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            type="submit"
            isLoading={isSubmitting}
            leftIcon={<Award className="w-4 h-4" />}
          >
            Record Decision
          </Button>
        </div>
      </form>
    </Modal>
  );
};
