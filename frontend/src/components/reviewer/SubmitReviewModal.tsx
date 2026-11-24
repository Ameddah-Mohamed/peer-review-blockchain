import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { calculateReviewHash } from '../../utils/crypto';
import { useNotification } from '../../context/NotificationContext';
import { reviewService } from '../../services/reviewService';
import { useAuth } from '../../context/AuthContext';
import { ReviewAssignment, ReviewScore, Recommendation } from '../../types';
import { ShieldCheck, Award } from 'lucide-react';

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
      showToast('warning', 'Missing Feedback', 'Please provide constructive evaluation comments for the authors.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Calculate cryptographic review integrity digest matching backend canonical schema
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
        'Review Sealed on Blockchain',
        'Your evaluation and integrity proof have been immutably recorded.'
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
      title="Peer Review Submission Form"
      subtitle={`Blind Review for: ${assignment.title}`}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Anonymity Banner */}
        <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-3 flex items-start gap-2.5">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="text-xs text-emerald-950">
            <span className="font-semibold">Double-Blind Guarantee:</span> Your review will be
            published exclusively under reviewer pseudonym{' '}
            <span className="font-mono font-bold bg-white px-1.5 py-0.2 rounded border border-emerald-200">
              {user?.pseudonymId}
            </span>
            . The author identity ({assignment.authorPseudonym}) remains pseudonymous.
          </div>
        </div>

        {/* Scoring Criteria Matrix */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Evaluation Criteria (1 to 5 Scale)
            </h4>
            <div className="flex items-center gap-1.5 bg-brand-50 text-brand-700 px-2.5 py-0.5 rounded-full text-xs font-bold">
              <Award className="w-3.5 h-3.5" />
              <span>Average: {overallScore.toFixed(1)} / 5.0</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* Originality */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1">
                <span>Originality & Novelty:</span>
                <span className="font-mono text-brand-600">{scores.originality} / 5</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                step="1"
                value={scores.originality}
                onChange={(e) => handleScoreChange('originality', parseInt(e.target.value))}
                className="w-full accent-brand-600 cursor-pointer"
              />
            </div>

            {/* Technical Quality */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1">
                <span>Technical Quality & Rigor:</span>
                <span className="font-mono text-brand-600">{scores.technicalQuality} / 5</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                step="1"
                value={scores.technicalQuality}
                onChange={(e) => handleScoreChange('technicalQuality', parseInt(e.target.value))}
                className="w-full accent-brand-600 cursor-pointer"
              />
            </div>

            {/* Clarity */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1">
                <span>Clarity & Organization:</span>
                <span className="font-mono text-brand-600">{scores.clarity} / 5</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                step="1"
                value={scores.clarity}
                onChange={(e) => handleScoreChange('clarity', parseInt(e.target.value))}
                className="w-full accent-brand-600 cursor-pointer"
              />
            </div>

            {/* Relevance */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1">
                <span>Relevance to Field:</span>
                <span className="font-mono text-brand-600">{scores.relevance} / 5</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                step="1"
                value={scores.relevance}
                onChange={(e) => handleScoreChange('relevance', parseInt(e.target.value))}
                className="w-full accent-brand-600 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Final Recommendation */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Overall Recommendation *
          </label>
          <select
            value={recommendation}
            onChange={(e) => setRecommendation(e.target.value as Recommendation)}
            className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-white"
          >
            <option value="strong_accept">Strong Accept (Outstanding paper)</option>
            <option value="accept">Accept (Solid contribution)</option>
            <option value="borderline">Borderline (Needs minor clarifications)</option>
            <option value="reject">Reject (Substantial technical flaws)</option>
            <option value="strong_reject">Strong Reject (Not suitable for publication)</option>
          </select>
        </div>

        {/* Author Feedback */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Detailed Comments for Authors *
          </label>
          <textarea
            required
            rows={4}
            value={authorComments}
            onChange={(e) => setAuthorComments(e.target.value)}
            placeholder="Provide detailed scientific feedback. Highlight strengths, explain methodological weaknesses, and provide actionable suggestions for improvement..."
            className="w-full text-xs sm:text-sm p-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors"
          />
        </div>

        {/* Confidential Remarks for Organizers */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Confidential Remarks for Conference Chairs (Optional)
          </label>
          <textarea
            rows={2}
            value={confidentialComments}
            onChange={(e) => setConfidentialComments(e.target.value)}
            placeholder="Confidential notes visible only to the Program Committee and Conference Chairs..."
            className="w-full text-xs sm:text-sm p-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors bg-slate-50/50"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
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
            Submit & Record Proof on Chain
          </Button>
        </div>
      </form>
    </Modal>
  );
};
