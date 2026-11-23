import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { calculateSHA256 } from '../../utils/crypto';
import { useNotification } from '../../context/NotificationContext';
import { paperService } from '../../services/paperService';
import { useAuth } from '../../context/AuthContext';
import { Upload, CheckCircle2, Shield } from 'lucide-react';
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
      showToast('info', 'Document Checksum Computed', 'SHA-256 hash successfully calculated.');
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
      showToast('warning', 'Missing Fields', 'Please complete all required fields and upload a PDF.');
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
        'Paper and SHA-256 integrity proof registered on the blockchain.'
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
      title="Submit Research Paper"
      subtitle="Initial submission with automated on-chain SHA-256 registration"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Blockchain proof info banner */}
        <div className="bg-purple-50/70 border border-purple-200/80 rounded-xl p-3.5 flex items-start gap-3">
          <Shield className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
          <div className="text-xs text-purple-900 leading-relaxed">
            <span className="font-semibold text-purple-950">Double-Blind & Immutability:</span> Your
            identity will be shielded behind pseudonym{' '}
            <span className="font-mono font-bold bg-white px-1.5 py-0.2 rounded border border-purple-200">
              {user?.pseudonymId}
            </span>
            . A SHA-256 hash of the PDF will be sealed on the blockchain ledger for proof of existence.
          </div>
        </div>

        {/* Paper Title */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Paper Title *</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Scalable Proof-of-Stake Consensus with Byzantine Fault Tolerance"
            className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors"
          />
        </div>

        {/* Track / Category */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Conference Track *
            </label>
            <select
              value={track}
              onChange={(e) => setTrack(e.target.value)}
              className="w-full text-xs sm:text-sm px-3 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-white transition-colors"
            >
              {CONFERENCE_TRACKS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Keywords (comma-separated)
            </label>
            <input
              type="text"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="Consensus, Zero-Knowledge, Latency"
              className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors"
            />
          </div>
        </div>

        {/* Abstract */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Abstract *</label>
          <textarea
            required
            rows={4}
            value={abstract}
            onChange={(e) => setAbstract(e.target.value)}
            placeholder="Provide a concise summary of the research methodology, problem formulation, and key findings..."
            className="w-full text-xs sm:text-sm p-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors"
          />
        </div>

        {/* PDF File Upload */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Manuscript PDF (Double-blind version) *
          </label>
          <div className="border-2 border-dashed border-slate-300 rounded-xl p-5 text-center hover:border-brand-500 transition-colors bg-slate-50/50">
            <input
              type="file"
              id="paper-file-upload"
              accept=".pdf,application/pdf"
              onChange={handleFileChange}
              className="hidden"
            />
            <label htmlFor="paper-file-upload" className="cursor-pointer block">
              <div className="w-10 h-10 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center mx-auto mb-2">
                <Upload className="w-5 h-5" />
              </div>
              <p className="text-xs font-medium text-slate-700">
                {file ? file.name : 'Click or drop PDF here to upload'}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Maximum file size: 25MB (PDF only)</p>
            </label>
          </div>
        </div>

        {/* Calculated SHA-256 */}
        {isHashing && (
          <div className="p-3 bg-slate-100 rounded-lg text-xs text-slate-600 flex items-center gap-2 animate-pulse">
            <div className="w-3.5 h-3.5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
            <span>Computing cryptographic SHA-256 digest in browser...</span>
          </div>
        )}

        {fileHash && !isHashing && (
          <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800 mb-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Calculated SHA-256 Digest:</span>
            </div>
            <HashViewer hash={fileHash} type="fileHash" truncate={false} />
            <p className="text-[11px] text-emerald-700/80 mt-1.5">
              This exact fingerprint will be signed and verified on-chain.
            </p>
          </div>
        )}

        {/* Buttons */}
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
            leftIcon={<Shield className="w-4 h-4" />}
          >
            Submit & Record on Chain
          </Button>
        </div>
      </form>
    </Modal>
  );
};
