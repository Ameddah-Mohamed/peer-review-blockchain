import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { calculateSHA256 } from '../../utils/crypto';
import { useNotification } from '../../context/NotificationContext';
import { paperService } from '../../services/paperService';
import { useAuth } from '../../context/AuthContext';
import { Paper } from '../../types';
import { Upload, CheckCircle2, ShieldAlert, GitCommit } from 'lucide-react';
import { HashViewer } from '../blockchain/HashViewer';

interface UploadVersionModalProps {
  isOpen: boolean;
  onClose: () => void;
  paper: Paper | null;
  onSuccess: () => void;
}

export const UploadVersionModal: React.FC<UploadVersionModalProps> = ({
  isOpen,
  onClose,
  paper,
  onSuccess,
}) => {
  const { user } = useAuth();
  const { showToast } = useNotification();

  const [changeLog, setChangeLog] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [fileHash, setFileHash] = useState<string>('');
  const [isHashing, setIsHashing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!paper) return null;

  const nextVersion = paper.currentVersion + 1;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setIsHashing(true);

    try {
      const hash = await calculateSHA256(selectedFile);
      setFileHash(hash);
      showToast('info', 'Checksum Ready', 'New version SHA-256 digest calculated.');
    } catch {
      showToast('error', 'Hashing Error', 'Failed to calculate file hash.');
    } finally {
      setIsHashing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !paper) return;
    if (!changeLog.trim() || !file || !fileHash) {
      showToast('warning', 'Missing Fields', 'Please describe the revisions and upload the revised PDF.');
      return;
    }

    setIsSubmitting(true);
    try {
      await paperService.submitVersion(
        paper.id,
        {
          file,
          fileHash,
          changeLog,
        },
        user
      );

      showToast(
        'success',
        `Version ${nextVersion} Registered`,
        'Revised manuscript hash recorded on blockchain ledger.'
      );
      setChangeLog('');
      setFile(null);
      setFileHash('');
      onSuccess();
      onClose();
    } catch (err: any) {
      showToast('error', 'Update Failed', err.message || 'Failed to submit revised version.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <GitCommit className="w-5 h-5 text-brand-600" />
          <span>Submit Revised Version (v{nextVersion})</span>
        </div>
      }
      subtitle={`Target: ${paper.title}`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3 text-xs text-amber-900 flex items-start gap-2.5">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p>
            Submitting a revision preserves all prior versions and hashes. The ledger will record a
            new timestamped proof for Version {nextVersion}.
          </p>
        </div>

        {/* Change Log */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Revisions & Response to Reviewers *
          </label>
          <textarea
            required
            rows={4}
            value={changeLog}
            onChange={(e) => setChangeLog(e.target.value)}
            placeholder="Summarize the changes made in this version (e.g., added comparison with baseline algorithm, refined theorem proof, updated figure 4)..."
            className="w-full text-xs sm:text-sm p-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors"
          />
        </div>

        {/* Revised PDF */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Revised PDF Document *
          </label>
          <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center hover:border-brand-500 transition-colors bg-slate-50/50">
            <input
              type="file"
              id="version-file-upload"
              accept=".pdf,application/pdf"
              onChange={handleFileChange}
              className="hidden"
            />
            <label htmlFor="version-file-upload" className="cursor-pointer block">
              <div className="w-9 h-9 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center mx-auto mb-1.5">
                <Upload className="w-4 h-4" />
              </div>
              <p className="text-xs font-medium text-slate-700">
                {file ? file.name : 'Select revised manuscript PDF'}
              </p>
            </label>
          </div>
        </div>

        {/* Hashing Indicator */}
        {isHashing && (
          <div className="p-3 bg-slate-100 rounded-lg text-xs text-slate-600 flex items-center gap-2 animate-pulse">
            <div className="w-3.5 h-3.5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
            <span>Calculating SHA-256 for revised document...</span>
          </div>
        )}

        {fileHash && !isHashing && (
          <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800 mb-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Version {nextVersion} SHA-256 Fingerprint:</span>
            </div>
            <HashViewer hash={fileHash} type="fileHash" truncate={false} />
          </div>
        )}

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
          <Button variant="outline" size="sm" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            type="submit"
            isLoading={isSubmitting}
            disabled={!file || !fileHash || isHashing}
          >
            Register Version {nextVersion}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
