import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { adminService } from '../../services/adminService';
import { useNotification } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import { Paper, User } from '../../types';
import { UserCheck, AlertCircle, Users } from 'lucide-react';

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
      subtitle={`Manuscript: ${paper.title}`}
      maxWidth="md"
    >
      <form onSubmit={handleAssign} className="space-y-4">
        {/* Double-Blind Notice */}
        <div className="bg-slate-50 border border-slate-200 rounded-md p-3 text-xs text-slate-600 flex items-start gap-2.5">
          <UserCheck className="w-4 h-4 text-slate-700 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            The assigned reviewer will evaluate this submission under author pseudonym{' '}
            <span className="font-mono font-medium text-slate-900 bg-white px-1.5 py-0.5 rounded border border-slate-200">
              {paper.authorPseudonym}
            </span>.
            Real identities remain strictly confidential.
          </p>
        </div>

        {/* Paper Info Metadata Strip */}
        <div className="bg-white border border-slate-200 rounded-md p-3 text-xs space-y-2">
          <div className="flex justify-between items-center text-slate-600">
            <span className="font-medium">Conference Track:</span>
            <span className="font-semibold text-slate-900">{paper.track}</span>
          </div>
          <div className="flex justify-between items-center text-slate-600">
            <span className="font-medium">Author Pseudonym:</span>
            <span className="font-mono text-slate-800">{paper.authorPseudonym}</span>
          </div>
          <div className="flex justify-between items-center text-slate-600">
            <span className="font-medium">Current Reviewers:</span>
            <span className="font-mono text-slate-900 font-medium">
              {paper.assignedReviewerCount || 0} assigned
            </span>
          </div>
        </div>

        {/* Select Reviewer */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Select Committee Reviewer <span className="text-rose-500">*</span>
          </label>
          {isLoading ? (
            <div className="p-3 text-center text-xs text-slate-500 bg-slate-50 rounded-md">
              Loading available reviewers...
            </div>
          ) : reviewers.length === 0 ? (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>No eligible reviewers available. (Ensure reviewers are registered and not the author).</span>
            </div>
          ) : (
            <select
              value={selectedReviewerId}
              onChange={(e) => setSelectedReviewerId(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:border-slate-900 bg-white text-slate-800"
            >
              {reviewers.map((rev) => (
                <option key={rev.id} value={rev.id}>
                  {rev.name} ({rev.pseudonymId}) — {rev.affiliation || 'Academic Institution'}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
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
