import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { calculateReviewHash } from '../../utils/crypto';
import { useNotification } from '../../context/NotificationContext';
import { reviewService } from '../../services/reviewService';
import { useAuth } from '../../context/AuthContext';
import { ReviewAssignment, ReviewScore, Recommendation } from '../../types';
import { ShieldCheck } from 'lucide-react';

interface SubmitReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignment: ReviewAssignment | null;
  onSuccess: () => void;
}

export const SubmitReviewModal: React.FC<SubmitReviewModalProps> = ({
  isOpen,
  onClose,
  assignment,
  onSuccess,
}) => {
  const { user } = useAuth();
  const { showToast } = useNotification();

  const [scores, setScores] = useState<ReviewScore>({
    originality: 4,
    technicalQuality: 4,
    clarity: 4,
    relevance: 4,
  });

  const [recommendation, setRecommendation] = useState<Recommendation>('accept');
  const [authorComments, setAuthorComments] = useState('');
  const [confidentialComments, setConfidentialComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!assignment) return null;

  const overallScore =
    (scores.originality + scores.technicalQuality + scores.clarity + scores.relevance) / 4;

  const handleScoreChange = (field: keyof ReviewScore, value: number) => {
    setScores((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!authorComments.trim()) {
      showToast('warning', 'Missing Evaluation', 'Please provide constructive evaluation comments for the authors.');
      return;
    }

    setIsSubmitting(true);
    try {
      const reviewHash = await calculateReviewHash({
        paperId: assignment.paperId,
        paperVersion: assignment.currentVersion || 1,
        scores,
        overallScore,
        recommendation,
        authorComments,
      });

      await reviewService.submitReview(
        {
          assignmentId: assignment.id,
          paperId: assignment.paperId,
          scores,
          overallScore,
          recommendation,
          authorComments,
          confidentialComments,
          reviewHash,
        },
        user
      );

      showToast(
        'success',
        'Review Recorded on Ledger',
        'Your evaluation digest has been sealed on the blockchain ledger.'
      );
      onSuccess();
      onClose();
    } catch (err: any) {
      showToast('error', 'Submission Failed', err.message || 'Unable to record review.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Submit Peer Evaluation"
      subtitle={`Blind Review • Manuscript: ${assignment.title}`}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Double Blind Guarantee Banner */}
        <div className="bg-slate-50 border border-slate-200 rounded-md p-3 flex items-start gap-2.5 text-xs text-slate-600">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-semibold text-slate-800">Double-Blind Guarantee:</span> You are reviewing
            author <span className="font-mono font-medium text-slate-800 bg-white px-1.5 py-0.5 rounded border border-slate-200">{assignment.authorPseudonym}</span>.
            Your review will be cryptographically attributed to reviewer pseudonym{' '}
            <span className="font-mono font-medium text-slate-800 bg-white px-1.5 py-0.5 rounded border border-slate-200">{user?.pseudonymId}</span>.
          </div>
        </div>

        {/* Scoring Criteria Matrix */}
        <div className="border border-slate-200 rounded-md p-4 space-y-4 bg-white">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-700">
              Quantitative Evaluation (1–5)
            </span>
            <span className="font-mono text-xs font-semibold text-slate-900 bg-slate-100 px-2.5 py-1 rounded">
              Mean: {overallScore.toFixed(1)} / 5.0
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Originality */}
            <div>
              <div className="flex items-center justify-between text-xs font-medium text-slate-700 mb-1.5">
                <span>Originality & Novelty:</span>
                <span className="font-mono font-bold text-slate-900">{scores.originality}/5</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                step="1"
                value={scores.originality}
                onChange={(e) => handleScoreChange('originality', parseInt(e.target.value))}
                className="w-full accent-slate-900 cursor-pointer"
              />
            </div>

            {/* Technical Quality */}
            <div>
              <div className="flex items-center justify-between text-xs font-medium text-slate-700 mb-1.5">
                <span>Technical Rigor & Soundness:</span>
                <span className="font-mono font-bold text-slate-900">{scores.technicalQuality}/5</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                step="1"
                value={scores.technicalQuality}
                onChange={(e) => handleScoreChange('technicalQuality', parseInt(e.target.value))}
                className="w-full accent-slate-900 cursor-pointer"
              />
            </div>

            {/* Clarity */}
            <div>
              <div className="flex items-center justify-between text-xs font-medium text-slate-700 mb-1.5">
                <span>Clarity of Presentation:</span>
                <span className="font-mono font-bold text-slate-900">{scores.clarity}/5</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                step="1"
                value={scores.clarity}
                onChange={(e) => handleScoreChange('clarity', parseInt(e.target.value))}
                className="w-full accent-slate-900 cursor-pointer"
              />
            </div>

            {/* Relevance */}
            <div>
              <div className="flex items-center justify-between text-xs font-medium text-slate-700 mb-1.5">
                <span>Relevance to Scope:</span>
                <span className="font-mono font-bold text-slate-900">{scores.relevance}/5</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                step="1"
                value={scores.relevance}
                onChange={(e) => handleScoreChange('relevance', parseInt(e.target.value))}
                className="w-full accent-slate-900 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Final Recommendation */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Recommendation Verdict <span className="text-rose-500">*</span>
          </label>
          <select
            value={recommendation}
            onChange={(e) => setRecommendation(e.target.value as Recommendation)}
            className="w-full text-xs px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:border-slate-900 bg-white text-slate-800"
          >
            <option value="strong_accept">Strong Accept (Clear top contribution)</option>
            <option value="accept">Accept (Valuable scientific result)</option>
            <option value="borderline">Borderline (Requires minor revisions/clarifications)</option>
            <option value="reject">Reject (Major conceptual or experimental flaws)</option>
            <option value="strong_reject">Strong Reject (Not suitable for publication)</option>
          </select>
        </div>

        {/* Author Feedback */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Constructive Comments for Authors <span className="text-rose-500">*</span>
          </label>
          <textarea
            required
            rows={5}
            value={authorComments}
            onChange={(e) => setAuthorComments(e.target.value)}
            placeholder="Provide detailed, objective scientific feedback. Highlight strengths, critique methodologies, and describe improvements needed..."
            className="w-full text-xs p-3 rounded-md border border-slate-300 focus:outline-none focus:border-slate-900 transition-colors bg-white font-sans text-slate-900 placeholder:text-slate-400"
          />
        </div>

        {/* Confidential Remarks */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Confidential Notes for Program Committee <span className="text-slate-400 font-normal">(Optional)</span>
          </label>
          <textarea
            rows={2}
            value={confidentialComments}
            onChange={(e) => setConfidentialComments(e.target.value)}
            placeholder="Confidential notes visible only to the Program Committee and Conference Chairs..."
            className="w-full text-xs p-2.5 rounded-md border border-slate-300 focus:outline-none focus:border-slate-900 transition-colors bg-slate-50/50 font-sans text-slate-900 placeholder:text-slate-400"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <Button variant="outline" size="sm" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            type="submit"
            isLoading={isSubmitting}
            leftIcon={<ShieldCheck className="w-4 h-4" />}
          >
            Submit & Record Proof
          </Button>
        </div>
      </form>
    </Modal>
  );
};
