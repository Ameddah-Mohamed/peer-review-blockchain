import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { adminService } from '../../services/adminService';
import { useNotification } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import { Paper, User } from '../../types';
import { UserCheck, ShieldAlert, Users } from 'lucide-react';

interface AssignReviewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  paper: Paper | null;
  onSuccess: () => void;
}

export const AssignReviewerModal: React.FC<AssignReviewerModalProps> = ({
  isOpen,
  onClose,
  paper,
  onSuccess,
}) => {
  const { user } = useAuth();
  const { showToast } = useNotification();

  const [reviewers, setReviewers] = useState<User[]>([]);
  const [selectedReviewerId, setSelectedReviewerId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadReviewers();
    }
  }, [isOpen]);

  const loadReviewers = async () => {
    setIsLoading(true);
    try {
      const allUsers = await adminService.getUsers();
      // Only reviewers who are not the author of this paper (conflict of interest prevention!)
      const available = allUsers.filter(
        (u) => u.role === 'reviewer' && u.id !== paper?.authorId
      );
      setReviewers(available);
      if (available.length > 0) {
        setSelectedReviewerId(available[0].id);
      }
    } catch {
      showToast('error', 'Error', 'Failed to load reviewers list.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !paper || !selectedReviewerId) return;

    setIsAssigning(true);
    try {
      await adminService.assignReviewer(paper.id, selectedReviewerId, user);
      showToast(
        'success',
        'Reviewer Assigned',
        'Assignment registered and signed on the blockchain ledger.'
      );
      onSuccess();
      onClose();
    } catch (err: any) {
      showToast('error', 'Assignment Error', err.message || 'Failed to assign reviewer.');
    } finally {
      setIsAssigning(false);
    }
  };

  if (!paper) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Assign Peer Reviewer"
      subtitle={`Paper: ${paper.title}`}
      maxWidth="md"
    >
      <form onSubmit={handleAssign} className="space-y-4">
        {/* Double-Blind Notice */}
        <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-3 text-xs text-blue-900 flex items-start gap-2.5">
          <UserCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <p>
            The assigned reviewer will access the submission under pseudonym{' '}
            <span className="font-mono font-bold">{paper.authorPseudonym}</span>. Real identities
            remain shielded.
          </p>
        </div>

        {/* Paper Info */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs space-y-1.5">
          <div className="flex justify-between">
            <span className="text-slate-500 font-medium">Conference Track:</span>
            <span className="font-semibold text-slate-800">{paper.track}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 font-medium">Author Pseudonym:</span>
            <span className="font-mono text-brand-700 font-semibold">{paper.authorPseudonym}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 font-medium">Current Reviewers:</span>
            <span className="text-slate-800 font-semibold">
              {paper.assignedReviewerCount || 0} assigned
            </span>
          </div>
        </div>

        {/* Select Reviewer */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Choose Qualified Reviewer *
          </label>
          {isLoading ? (
            <div className="p-3 text-center text-xs text-slate-500 bg-slate-50 rounded-lg animate-pulse">
              Loading qualified reviewers...
            </div>
          ) : reviewers.length === 0 ? (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
              <span>No other available reviewers found. Register reviewers first.</span>
            </div>
          ) : (
            <select
              value={selectedReviewerId}
              onChange={(e) => setSelectedReviewerId(e.target.value)}
              className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-white"
            >
              {reviewers.map((rev) => (
                <option key={rev.id} value={rev.id}>
                  {rev.name} ({rev.pseudonymId}) — {rev.affiliation || 'Academic'}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
          <Button variant="outline" size="sm" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            type="submit"
            isLoading={isAssigning}
            disabled={reviewers.length === 0 || isLoading}
            leftIcon={<Users className="w-4 h-4" />}
          >
            Confirm Assignment
          </Button>
        </div>
      </form>
    </Modal>
  );
};
