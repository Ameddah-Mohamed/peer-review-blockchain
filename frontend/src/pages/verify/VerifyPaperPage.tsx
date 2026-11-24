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
  ShieldAlert,
  Upload,
  FileCheck,
  Search,
  CheckCircle,
  AlertTriangle,
  Cpu,
  Clock,
  Key,
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
        calculatedHash: inputHash || '',
        message: err.message || 'Verification failed. Please check network connection.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const runVerification = async (paperId?: string, hash?: string, ver?: number) => {
    setIsProcessing(true);
    try {
      const res = await blockchainService.verifyPaper(paperId, hash, ver);
      setResult(res);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-6">
      {/* Title */}
      <div className="border-b border-slate-200 pb-5 text-center sm:text-left">
        <div className="flex items-center justify-center sm:justify-start gap-2 text-xs font-mono text-slate-500 mb-1">
          <span>Public Ledger Verification</span>
          <span>/</span>
          <span>Proof of Existence</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Document Integrity Verifier
        </h1>
        <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
          Verify manuscript authenticity and timestamp validity against the immutable distributed ledger. 
          The cryptographic SHA-256 fingerprint is computed locally in your browser.
        </p>
      </div>

      {/* Main Verification Interface */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-2xs">
        {/* Mode Switcher */}
        <div className="flex border-b border-slate-200 bg-slate-50/70 p-1 gap-1">
          <button
            type="button"
            onClick={() => {
              setActiveTab('upload');
              setResult(null);
            }}
            className={`flex-1 py-1.5 px-3 rounded-md text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'upload'
                ? 'bg-white text-slate-900 font-semibold shadow-2xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Upload className="w-3.5 h-3.5 text-slate-500" />
            <span>Verify by PDF Upload</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('hash');
              setResult(null);
            }}
            className={`flex-1 py-1.5 px-3 rounded-md text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'hash'
                ? 'bg-white text-slate-900 font-semibold shadow-2xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Search className="w-3.5 h-3.5 text-slate-500" />
            <span>Verify by SHA-256 Digest or Paper ID</span>
          </button>
        </div>

        <div className="p-6 space-y-4">
          {activeTab === 'upload' ? (
            <div className="space-y-4">
              <div className="border border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-slate-400 transition-colors bg-slate-50/40">
                <input
                  type="file"
                  id="verify-file"
                  accept=".pdf,application/pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <label htmlFor="verify-file" className="cursor-pointer block space-y-2">
                  <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 text-slate-600 flex items-center justify-center mx-auto mb-2 shadow-2xs">
                    <FileCheck className="w-5 h-5" />
                  </div>
                  <h3 className="text-xs font-semibold text-slate-800">
                    {file ? file.name : 'Choose a research manuscript PDF to verify'}
                  </h3>
                  <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                    The SHA-256 checksum is computed via the Web Crypto API without uploading the document content to any external server.
                  </p>
                </label>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Optional: Specific Paper ID
                </label>
                <input
                  type="text"
                  value={inputPaperId}
                  onChange={(e) => setInputPaperId(e.target.value)}
                  placeholder="e.g. paper_001 (optional for targeted matching)"
                  className="w-full text-xs px-3 py-1.5 rounded-md border border-slate-200 focus:outline-none focus:border-slate-400 bg-slate-50/50"
                />
              </div>
            </div>
          ) : (
            <form onSubmit={handleManualVerification} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  SHA-256 Digest (64 Hex Characters)
                </label>
                <input
                  type="text"
                  value={inputHash}
                  onChange={(e) => setInputHash(e.target.value)}
                  placeholder="e.g. e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
                  className="w-full font-mono text-xs px-3 py-1.5 rounded-md border border-slate-200 focus:outline-none focus:border-slate-400 bg-slate-50/50"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Paper ID (Optional)
                </label>
                <input
                  type="text"
                  value={inputPaperId}
                  onChange={(e) => setInputPaperId(e.target.value)}
                  placeholder="e.g. paper_001"
                  className="w-full text-xs px-3 py-1.5 rounded-md border border-slate-200 focus:outline-none focus:border-slate-400 bg-slate-50/50"
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full"
                isLoading={isProcessing}
                leftIcon={<ShieldCheck className="w-3.5 h-3.5" />}
              >
                Query Blockchain Ledger
              </Button>
            </form>
          )}

          {isProcessing && (
            <div className="py-6 text-center space-y-2">
              <div className="w-5 h-5 border-2 border-slate-700 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-slate-500 font-mono">Verifying cryptographic hash on-chain...</p>
            </div>
          )}

          {/* Results Presentation */}
          {result && !isProcessing && (
            <div className="pt-4 border-t border-slate-100">
              {result.matchStatus === 'MATCH_CONFIRMED' ? (
                <div className="bg-emerald-50/70 border border-emerald-200/90 rounded-lg p-5 space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wide">
                        Integrity Verified: Match Confirmed
                      </h4>
                      <p className="text-xs text-emerald-900 mt-0.5 leading-relaxed">
                        The document's SHA-256 fingerprint exactly matches the cryptographic record anchored on the smart contract.
                      </p>
                    </div>
                  </div>

                  {result.blockchainRecord && (
                    <div className="bg-white rounded-md p-4 border border-emerald-200/60 space-y-2 text-xs text-slate-700">
                      <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                        <span className="text-slate-500 font-medium">Registered Manuscript:</span>
                        <span className="font-mono font-semibold text-slate-900">
                          {result.blockchainRecord.paperId} (Version {result.blockchainRecord.version})
                        </span>
                      </div>

                      <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                        <span className="text-slate-500 font-medium flex items-center gap-1">
                          <Cpu className="w-3.5 h-3.5 text-slate-400" />
                          <span>Block Height:</span>
                        </span>
                        <span className="font-mono font-semibold text-slate-900 tabular-nums">
                          Block #{result.blockchainRecord.blockNumber}
                        </span>
                      </div>

                      <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                        <span className="text-slate-500 font-medium flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>Timestamp:</span>
                        </span>
                        <span className="tabular-nums">{formatDate(result.blockchainRecord.blockTimestamp)}</span>
                      </div>

                      <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                        <span className="text-slate-500 font-medium flex items-center gap-1">
                          <Key className="w-3.5 h-3.5 text-slate-400" />
                          <span>Author Pseudonym:</span>
                        </span>
                        <span className="font-mono bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded text-[11px] font-semibold border border-slate-200">
                          {result.blockchainRecord.authorPseudonym}
                        </span>
                      </div>

                      <div className="pt-1">
                        <span className="text-slate-500 font-medium block mb-1">
                          On-Chain SHA-256 Digest:
                        </span>
                        <HashViewer hash={result.blockchainRecord.onChainHash} type="fileHash" truncate={false} />
                      </div>

                      <div className="pt-1">
                        <span className="text-slate-500 font-medium block mb-1">
                          Transaction Hash:
                        </span>
                        <HashViewer hash={result.blockchainRecord.txHash} type="txHash" truncate={false} />
                      </div>
                    </div>
                  )}
                </div>
              ) : result.matchStatus === 'HASH_MISMATCH' ? (
                <div className="bg-rose-50/70 border border-rose-200/90 rounded-lg p-5 space-y-3">
                  <div className="flex items-start gap-3">
                    <ShieldAlert className="w-5 h-5 text-rose-700 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-rose-950 uppercase tracking-wide">
                        Integrity Discrepancy (Hash Mismatch)
                      </h4>
                      <p className="text-xs text-rose-900 mt-0.5 leading-relaxed">
                        {result.message || 'The calculated file hash does not match the registered on-chain digest for this paper.'}
                      </p>
                    </div>
                  </div>

                  <div className="bg-white rounded-md p-3 border border-rose-200/60 text-xs space-y-2">
                    <div>
                      <span className="text-slate-500 block mb-0.5 font-medium">Provided File Hash:</span>
                      <HashViewer hash={result.calculatedHash} type="fileHash" truncate={false} />
                    </div>
                    {result.blockchainRecord && (
                      <div>
                        <span className="text-slate-500 block mb-0.5 font-medium">Registered On-Chain Hash:</span>
                        <HashViewer hash={result.blockchainRecord.onChainHash} type="fileHash" truncate={false} />
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-5 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                      No Record Found on Blockchain
                    </h4>
                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                      {result.message || 'This document digest has not been registered on the conference ledger.'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
