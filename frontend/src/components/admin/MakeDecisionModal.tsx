import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { adminService } from '../../services/adminService';
import { useNotification } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import { Paper } from '../../types';
import { Award, CheckCircle, XCircle, RotateCcw } from 'lucide-react';
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
      title="Record Final Conference Decision"
      subtitle={`Paper: ${paper.title}`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Peer Reviews Summary Box */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 text-xs">
          <div className="flex items-center justify-between font-semibold text-slate-800">
            <span>Peer Reviews Summary ({reviews.length} submitted):</span>
            <span className="font-mono bg-white px-2 py-0.5 rounded border border-slate-200">
              Avg Score: {averageScore} / 5.0
            </span>
          </div>

          {reviews.length > 0 ? (
            <div className="space-y-1.5 pt-1">
              {reviews.map((r, i) => (
                <div key={r.id || i} className="flex items-center justify-between bg-white p-2 rounded-lg border border-slate-100">
                  <span className="font-mono text-slate-600">{r.reviewerPseudonym}</span>
                  <div className="flex items-center gap-2">
                    <Badge recommendation={r.recommendation} size="sm" />
                    <span className="font-bold text-slate-700">{r.overallScore.toFixed(1)}/5</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 italic py-1">No completed reviews submitted yet.</p>
          )}
        </div>

        {/* Decision Selection */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Final Verdict *
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setDecision('accepted')}
              className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                decision === 'accepted'
                  ? 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-500/20 font-semibold'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              <span className="text-xs">Accept</span>
            </button>

            <button
              type="button"
              onClick={() => setDecision('revision_requested')}
              className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                decision === 'revision_requested'
                  ? 'bg-amber-50 border-amber-500 text-amber-900 ring-2 ring-amber-500/20 font-semibold'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <RotateCcw className="w-5 h-5 text-amber-600" />
              <span className="text-xs">Revision</span>
            </button>

            <button
              type="button"
              onClick={() => setDecision('rejected')}
              className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                decision === 'rejected'
                  ? 'bg-rose-50 border-rose-500 text-rose-900 ring-2 ring-rose-500/20 font-semibold'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <XCircle className="w-5 h-5 text-rose-600" />
              <span className="text-xs">Reject</span>
            </button>
          </div>
        </div>

        {/* Remarks */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Official Decision Remarks & Notification *
          </label>
          <textarea
            required
            rows={4}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Official rationale for acceptance/rejection sent to the author and permanently sealed on-chain..."
            className="w-full text-xs sm:text-sm p-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors"
          />
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
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
            Record Decision on Chain
          </Button>
        </div>
      </form>
    </Modal>
  );
};
