import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { calculateSHA256 } from '../../utils/crypto';
import { useNotification } from '../../context/NotificationContext';
import { paperService } from '../../services/paperService';
import { useAuth } from '../../context/AuthContext';
import { Paper } from '../../types';
import { Upload, CheckCircle2, Info, GitCommit } from 'lucide-react';
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
      showToast('info', 'Checksum Computed', 'Revised manuscript SHA-256 digest calculated.');
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
          <GitCommit className="w-4 h-4 text-slate-700" />
          <span>Submit Revised Version (v{nextVersion})</span>
        </div>
      }
      subtitle={`Manuscript: ${paper.title}`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-slate-50 border border-slate-200 rounded-md p-3 text-xs text-slate-600 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            All prior revisions remain cryptographically preserved in the immutable version chain.
            Version {nextVersion} will be sealed with a new timestamped ledger proof.
          </p>
        </div>

        {/* Change Log */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Summary of Revisions & Response to Reviewers <span className="text-rose-500">*</span>
          </label>
          <textarea
            required
            rows={4}
            value={changeLog}
            onChange={(e) => setChangeLog(e.target.value)}
            placeholder="Detail all updates addressed in this version (e.g. addressed reviewer 1 critique on baseline complexity, added theorem proof 3.2, updated empirical benchmark charts)..."
            className="w-full text-xs p-3 rounded-md border border-slate-300 focus:outline-none focus:border-slate-900 transition-colors bg-white font-sans text-slate-900 placeholder:text-slate-400"
          />
        </div>

        {/* Revised PDF */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Revised PDF Manuscript <span className="text-rose-500">*</span>
          </label>
          <div className="border border-dashed border-slate-300 rounded-md p-5 text-center hover:border-slate-500 transition-colors bg-slate-50/50">
            <input
              type="file"
              id="version-file-upload"
              accept=".pdf,application/pdf"
              onChange={handleFileChange}
              className="hidden"
            />
            <label htmlFor="version-file-upload" className="cursor-pointer block">
              <div className="w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-700 flex items-center justify-center mx-auto mb-2 shadow-2xs">
                <Upload className="w-3.5 h-3.5" />
              </div>
              <p className="text-xs font-medium text-slate-800">
                {file ? file.name : 'Select or drop revised manuscript PDF'}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                PDF only (up to 50MB) • Client-side SHA-256 calculation
              </p>
            </label>
          </div>
        </div>

        {/* Hashing Indicator */}
        {isHashing && (
          <div className="p-3 bg-slate-100 rounded-md text-xs text-slate-600 flex items-center gap-2">
            <div className="w-3.5 h-3.5 border-2 border-slate-700 border-t-transparent rounded-full animate-spin" />
            <span>Calculating SHA-256 cryptographic digest...</span>
          </div>
        )}

        {fileHash && !isHashing && (
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-md space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-800">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Version {nextVersion} SHA-256 Checksum:</span>
            </div>
            <HashViewer hash={fileHash} type="fileHash" truncate={false} />
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
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
