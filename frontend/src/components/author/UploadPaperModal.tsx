import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { calculateSHA256 } from '../../utils/crypto';
import { useNotification } from '../../context/NotificationContext';
import { paperService } from '../../services/paperService';
import { useAuth } from '../../context/AuthContext';
import { Upload, CheckCircle, Shield } from 'lucide-react';
import { HashViewer } from '../blockchain/HashViewer';

interface UploadPaperModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CONFERENCE_TRACKS = [
  'Blockchain & Cryptography',
  'Scalability & Layer 2 Protocols',
  'Formal Methods & Smart Contract Security',
  'Decentralized Consensus Algorithms',
  'Privacy-Preserving Technologies & ZKP',
];

export const UploadPaperModal: React.FC<UploadPaperModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { user } = useAuth();
  const { showToast } = useNotification();

  const [title, setTitle] = useState('');
  const [abstract, setAbstract] = useState('');
  const [track, setTrack] = useState(CONFERENCE_TRACKS[0]);
  const [keywords, setKeywords] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [fileHash, setFileHash] = useState<string>('');
  const [isHashing, setIsHashing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (selectedFile.type !== 'application/pdf' && !selectedFile.name.endsWith('.pdf')) {
      showToast('error', 'Invalid File Type', 'Please upload a PDF document.');
      return;
    }

    setFile(selectedFile);
    setIsHashing(true);

    try {
      const hash = await calculateSHA256(selectedFile);
      setFileHash(hash);
      showToast('info', 'Checksum Computed', 'SHA-256 fingerprint generated.');
    } catch {
      showToast('error', 'Hashing Error', 'Failed to calculate file hash.');
    } finally {
      setIsHashing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!title.trim() || !abstract.trim() || !file || !fileHash) {
      showToast('warning', 'Missing Fields', 'Please complete all required fields and select a PDF.');
      return;
    }

    setIsSubmitting(true);
    try {
      const parsedKeywords = keywords
        .split(',')
        .map((k) => k.trim())
        .filter(Boolean);

      await paperService.submitPaper(
        {
          title,
          abstract,
          track,
          keywords: parsedKeywords.length ? parsedKeywords : ['Blockchain', 'Peer Review'],
          file,
          fileHash,
        },
        user
      );

      showToast(
        'success',
        'Submission Recorded',
        'Manuscript and SHA-256 integrity proof registered on the blockchain.'
      );
      // Reset state
      setTitle('');
      setAbstract('');
      setKeywords('');
      setFile(null);
      setFileHash('');
      onSuccess();
      onClose();
    } catch (err: any) {
      showToast('error', 'Submission Failed', err.message || 'Unable to register paper.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Submit Research Manuscript"
      subtitle="Initial submission with automated on-chain SHA-256 registration"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Double-Blind note */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex items-start gap-2.5 text-xs text-slate-600">
          <Shield className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
          <div>
            Your manuscript will be assigned under pseudonym{' '}
            <span className="font-mono font-semibold text-slate-900 bg-white px-1.5 py-0.5 rounded border border-slate-200">
              {user?.pseudonymId}
            </span>
            . A SHA-256 checksum of your PDF will be permanently anchored to the smart contract ledger.
          </div>
        </div>

        {/* Paper Title */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Manuscript Title *</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Scalable Proof-of-Stake Consensus with Byzantine Fault Tolerance"
            className="w-full text-xs px-3 py-1.5 rounded-md border border-slate-200 focus:outline-none focus:border-slate-400 bg-slate-50/50"
          />
        </div>

        {/* Track and Keywords */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Conference Track *
            </label>
            <select
              value={track}
              onChange={(e) => setTrack(e.target.value)}
              className="w-full text-xs px-3 py-1.5 rounded-md border border-slate-200 focus:outline-none focus:border-slate-400 bg-white text-slate-800"
            >
              {CONFERENCE_TRACKS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Keywords (comma-separated)
            </label>
            <input
              type="text"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="Consensus, Zero-Knowledge, Latency"
              className="w-full text-xs px-3 py-1.5 rounded-md border border-slate-200 focus:outline-none focus:border-slate-400 bg-slate-50/50"
            />
          </div>
        </div>

        {/* Abstract */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Abstract *</label>
          <textarea
            required
            rows={3}
            value={abstract}
            onChange={(e) => setAbstract(e.target.value)}
            placeholder="Provide a concise summary of research methodology, technical contribution, and findings..."
            className="w-full text-xs p-2.5 rounded-md border border-slate-200 focus:outline-none focus:border-slate-400 bg-slate-50/50"
          />
        </div>

        {/* PDF Dropzone */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Manuscript PDF (Double-blind version) *
          </label>
          <div className="border border-dashed border-slate-300 rounded-lg p-5 text-center hover:border-slate-400 transition-colors bg-slate-50/40">
            <input
              type="file"
              id="paper-file-upload"
              accept=".pdf,application/pdf"
              onChange={handleFileChange}
              className="hidden"
            />
            <label htmlFor="paper-file-upload" className="cursor-pointer block">
              <div className="w-8 h-8 rounded-md bg-white border border-slate-200 text-slate-500 flex items-center justify-center mx-auto mb-1.5 shadow-2xs">
                <Upload className="w-4 h-4" />
              </div>
              <p className="text-xs font-medium text-slate-800">
                {file ? file.name : 'Select or drop PDF manuscript here'}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Maximum file size: 25MB (PDF only)</p>
            </label>
          </div>
        </div>

        {/* Hashing status / result */}
        {isHashing && (
          <div className="p-2.5 bg-slate-100 rounded text-xs text-slate-600 flex items-center gap-2">
            <div className="w-3.5 h-3.5 border-2 border-slate-600 border-t-transparent rounded-full animate-spin" />
            <span className="font-mono text-[11px]">Computing SHA-256 fingerprint in browser...</span>
          </div>
        )}

        {fileHash && !isHashing && (
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>Calculated SHA-256 Digest:</span>
            </div>
            <HashViewer hash={fileHash} type="fileHash" truncate={false} />
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <Button variant="outline" size="xs" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="xs"
            type="submit"
            isLoading={isSubmitting}
            disabled={!file || !fileHash || isHashing}
          >
            Submit & Record on Ledger
          </Button>
        </div>
      </form>
    </Modal>
  );
};
