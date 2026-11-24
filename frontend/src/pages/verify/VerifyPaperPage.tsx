import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { blockchainService } from '../../services/blockchainService';
import { calculateSHA256 } from '../../utils/crypto';
import { VerificationResult } from '../../types';
import { Button } from '../../components/common/Button';
import { HashViewer } from '../../components/blockchain/HashViewer';
import { formatDate } from '../../utils/formatters';
import {
  ShieldCheck,
  Upload,
  Search,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';

export const VerifyPaperPage: React.FC = () => {
  const [searchParams] = useSearchParams();

  const [activeTab, setActiveTab] = useState<'upload' | 'hash'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [inputHash, setInputHash] = useState('');
  const [inputPaperId, setInputPaperId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);

  useEffect(() => {
    const urlPaperId = searchParams.get('paperId');
    const urlHash = searchParams.get('hash');
    const urlVersion = searchParams.get('version');

    if (urlHash) {
      setInputHash(urlHash);
      setActiveTab('hash');
    }
    if (urlPaperId) {
      setInputPaperId(urlPaperId);
    }

    if (urlHash || urlPaperId) {
      runVerification(urlPaperId || undefined, urlHash || undefined, urlVersion ? parseInt(urlVersion) : undefined);
    }
  }, [searchParams]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setIsProcessing(true);
    setResult(null);

    try {
      if (inputPaperId) {
        const calculatedDigest = await calculateSHA256(selectedFile);
        const res = await blockchainService.verifyPaper(
          inputPaperId.trim(),
          calculatedDigest
        );
        setResult(res);
      } else {
        const res = await blockchainService.verifyFile(selectedFile);
        setResult(res);
      }
    } catch (err: any) {
      console.error(err);
      setResult({
        verified: false,
        matchStatus: 'RECORD_NOT_FOUND',
        calculatedHash: '',
        message: err.message || 'Verification failed. Please check network connection.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputHash && !inputPaperId) return;

    setIsProcessing(true);
    setResult(null);

    try {
      const res = await blockchainService.verifyPaper(
        inputPaperId ? inputPaperId.trim() : undefined,
        inputHash ? inputHash.trim() : undefined
      );
      setResult(res);
    } catch (err: any) {
      console.error(err);
      setResult({
        verified: false,
        matchStatus: 'RECORD_NOT_FOUND',
        calculatedHash: inputHash,
        message: err.message || 'Verification check failed.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const runVerification = async (paperId?: string, hash?: string, version?: number) => {
    setIsProcessing(true);
    try {
      const res = await blockchainService.verifyPaper(paperId, hash, version);
      setResult(res);
    } catch {
      setResult(null);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Editorial Bar */}
      <div className="text-center space-y-2 pb-2">
        <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-full text-xs font-mono font-medium">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Smart Contract Non-Repudiation Notary</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Manuscript Document Integrity Verifier
        </h1>
        <p className="text-xs text-slate-500 max-w-xl mx-auto leading-relaxed">
          Verify whether a research PDF manuscript is authentic, unmodified, and registered on the decentralized blockchain ledger.
        </p>
      </div>

      {/* Verification Input Box */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200/80 bg-slate-50/50">
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`flex-1 py-3 text-xs font-semibold text-center transition-colors border-b-2 ${
              activeTab === 'upload'
                ? 'border-slate-900 text-slate-900 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Upload PDF for Client-Side Checksum Verification
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('hash')}
            className={`flex-1 py-3 text-xs font-semibold text-center transition-colors border-b-2 ${
              activeTab === 'hash'
                ? 'border-slate-900 text-slate-900 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Verify via SHA-256 Digest or Manuscript ID
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'upload' ? (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-slate-200 hover:border-slate-400 rounded-xl p-8 text-center bg-slate-50/40 transition-colors">
                <input
                  type="file"
                  id="notary-file-input"
                  accept=".pdf,application/pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <label htmlFor="notary-file-input" className="cursor-pointer block space-y-2">
                  <div className="w-12 h-12 rounded-full bg-white border border-slate-200 text-slate-700 flex items-center justify-center mx-auto shadow-2xs">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-900">
                      {file ? file.name : 'Select or drop PDF manuscript to notarize'}
                    </span>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Computed strictly inside your browser using SHA-256. PDF content is never transmitted without encryption.
                    </p>
                  </div>
                </label>
              </div>

              {isProcessing && (
                <div className="p-3 bg-slate-50 rounded-lg text-xs text-slate-600 flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-slate-700 border-t-transparent rounded-full animate-spin" />
                  <span>Computing SHA-256 & cross-referencing ledger smart contract...</span>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleManualVerification} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Manuscript ID (Optional)
                  </label>
                  <input
                    type="text"
                    value={inputPaperId}
                    onChange={(e) => setInputPaperId(e.target.value)}
                    placeholder="e.g. paper_001"
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-slate-400 bg-slate-50/50 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    SHA-256 Hash Digest
                  </label>
                  <input
                    type="text"
                    value={inputHash}
                    onChange={(e) => setInputHash(e.target.value)}
                    placeholder="64-character hexadecimal SHA-256 string..."
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-slate-400 bg-slate-50/50 font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  variant="primary"
                  size="sm"
                  type="submit"
                  isLoading={isProcessing}
                  disabled={!inputHash && !inputPaperId}
                  leftIcon={<Search className="w-3.5 h-3.5" />}
                >
                  Query Ledger
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Verification Result Certificate */}
      {result && (
        <div
          className={`p-6 rounded-xl border shadow-2xs space-y-5 transition-all ${
            result.verified
              ? 'bg-emerald-50/40 border-emerald-300 text-slate-900'
              : 'bg-rose-50/40 border-rose-300 text-slate-900'
          }`}
        >
          {/* Certificate Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  result.verified
                    ? 'bg-emerald-600 text-white'
                    : 'bg-rose-600 text-white'
                }`}
              >
                {result.verified ? (
                  <CheckCircle className="w-6 h-6" />
                ) : (
                  <AlertTriangle className="w-6 h-6" />
                )}
              </div>
              <div>
                <h3 className="text-base font-bold tracking-tight">
                  {result.verified
                    ? 'Cryptographic Authenticity Certified'
                    : 'Document Verification Alert'}
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  {result.verified
                    ? 'The computed SHA-256 fingerprint matches the immutable blockchain record exactly.'
                    : result.message || 'No matching hash found on the blockchain ledger.'}
                </p>
              </div>
            </div>

            <span
              className={`font-mono text-xs px-2.5 py-1 rounded font-bold uppercase ${
                result.verified
                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                  : 'bg-rose-100 text-rose-900 border border-rose-300'
              }`}
            >
              {result.matchStatus || (result.verified ? 'VERIFIED' : 'UNVERIFIED')}
            </span>
          </div>

          {/* Metadata Breakdown */}
          {result.blockchainRecord && (
            <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-3 text-xs">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Blockchain Record Data
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-400 block text-[11px]">Manuscript Target:</span>
                  <span className="font-semibold text-slate-900 font-mono">
                    {result.blockchainRecord.paperId} (v{result.blockchainRecord.version})
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px]">Author Pseudonym:</span>
                  <span className="font-mono text-slate-800">
                    {result.blockchainRecord.authorPseudonym}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px]">Registered Block:</span>
                  <span className="font-mono text-slate-800">
                    #{result.blockchainRecord.blockNumber}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px]">Block Timestamp:</span>
                  <span className="font-mono text-slate-800">
                    {formatDate(result.blockchainRecord.blockTimestamp)}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-1">
                <span className="text-slate-400 block text-[11px]">Recorded File SHA-256:</span>
                <HashViewer hash={result.blockchainRecord.onChainHash} type="fileHash" truncate={false} />
              </div>

              <div className="space-y-1">
                <span className="text-slate-400 block text-[11px]">Blockchain Tx Proof:</span>
                <HashViewer hash={result.blockchainRecord.txHash} type="txHash" truncate={false} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
