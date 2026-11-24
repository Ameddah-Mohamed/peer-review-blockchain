import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { blockchainService } from '../../services/blockchainService';
import { calculateSHA256 } from '../../utils/crypto';
import { VerificationResult } from '../../types';
import { Button } from '../../components/common/Button';
import { Card, CardBody } from '../../components/common/Card';
import { HashViewer } from '../../components/blockchain/HashViewer';
import { formatDate } from '../../utils/formatters';
import {
  ShieldCheck,
  ShieldAlert,
  Upload,
  FileCheck2,
  Search,
  CheckCircle2,
  AlertTriangle,
  Blocks,
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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      {/* Page Title */}
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-700 border border-purple-200 flex items-center justify-center mx-auto shadow-sm">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          Blockchain Integrity & Timestamp Verifier
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto leading-relaxed">
          Verify cryptographic proof-of-existence and ensure manuscripts have not been modified,
          tampered with, or substituted since registration on the smart contract.
        </p>
      </div>

      {/* Main Verifier Card */}
      <Card>
        {/* Mode switcher tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50/70 p-1.5 rounded-t-xl gap-1">
          <button
            type="button"
            onClick={() => {
              setActiveTab('upload');
              setResult(null);
            }}
            className={`flex-1 py-2 px-4 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'upload'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Upload Document to Verify</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('hash');
              setResult(null);
            }}
            className={`flex-1 py-2 px-4 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'hash'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Search className="w-4 h-4" />
            <span>Verify by SHA-256 Digest or Paper ID</span>
          </button>
        </div>

        <CardBody className="p-6">
          {activeTab === 'upload' ? (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center hover:border-purple-500 transition-colors bg-purple-50/10">
                <input
                  type="file"
                  id="verify-file"
                  accept=".pdf,application/pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <label htmlFor="verify-file" className="cursor-pointer block space-y-2">
                  <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center mx-auto mb-2">
                    <FileCheck2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-800">
                    {file ? file.name : 'Select or drop a research paper PDF'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    The SHA-256 hash is computed in your browser using Web Crypto API and checked
                    against the smart contract ledger.
                  </p>
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Optional: Specific Paper ID
                </label>
                <input
                  type="text"
                  value={inputPaperId}
                  onChange={(e) => setInputPaperId(e.target.value)}
                  placeholder="e.g. paper_001 (optional for targeted matching)"
                  className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                />
              </div>
            </div>
          ) : (
            <form onSubmit={handleManualVerification} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  SHA-256 Cryptographic Digest (64 Hex Characters)
                </label>
                <input
                  type="text"
                  value={inputHash}
                  onChange={(e) => setInputHash(e.target.value)}
                  placeholder="e.g. e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
                  className="w-full font-mono text-xs px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Paper ID
                </label>
                <input
                  type="text"
                  value={inputPaperId}
                  onChange={(e) => setInputPaperId(e.target.value)}
                  placeholder="e.g. paper_001"
                  className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full bg-purple-600 hover:bg-purple-700 focus:ring-purple-500"
                isLoading={isProcessing}
                leftIcon={<ShieldCheck className="w-4 h-4" />}
              >
                Verify on Blockchain Ledger
              </Button>
            </form>
          )}

          {isProcessing && (
            <div className="py-8 text-center space-y-2 animate-pulse">
              <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-slate-500">Querying on-chain state and verifying checksums...</p>
            </div>
          )}

          {/* Verification Result Display */}
          {result && !isProcessing && (
            <div className="mt-6 pt-6 border-t border-slate-100">
              {result.matchStatus === 'MATCH_CONFIRMED' ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 space-y-4 animate-fade-in">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-emerald-950">
                        Blockchain Verification Confirmed
                      </h4>
                      <p className="text-xs text-emerald-800 mt-0.5 leading-relaxed">
                        {result.message || 'Cryptographic fingerprint perfectly matches the immutable smart contract record.'}
                      </p>
                    </div>
                  </div>

                  {result.blockchainRecord && (
                    <div className="bg-white/80 rounded-xl p-4 border border-emerald-200/80 space-y-2.5 text-xs text-slate-700">
                      <div className="flex justify-between items-center pb-2 border-b border-emerald-100">
                        <span className="text-slate-500 font-medium">Registered Paper:</span>
                        <span className="font-mono font-bold text-slate-800">
                          {result.blockchainRecord.paperId} (Version {result.blockchainRecord.version})
                        </span>
                      </div>

                      <div className="flex justify-between items-center pb-2 border-b border-emerald-100">
                        <span className="text-slate-500 font-medium flex items-center gap-1">
                          <Blocks className="w-3.5 h-3.5 text-slate-400" />
                          Block Height:
                        </span>
                        <span className="font-mono font-bold text-purple-700">
                          Block #{result.blockchainRecord.blockNumber}
                        </span>
                      </div>

                      <div className="flex justify-between items-center pb-2 border-b border-emerald-100">
                        <span className="text-slate-500 font-medium flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          Block Timestamp:
                        </span>
                        <span>{formatDate(result.blockchainRecord.blockTimestamp)}</span>
                      </div>

                      <div className="flex justify-between items-center pb-2 border-b border-emerald-100">
                        <span className="text-slate-500 font-medium flex items-center gap-1">
                          <Key className="w-3.5 h-3.5 text-slate-400" />
                          Author Pseudonym:
                        </span>
                        <span className="font-mono bg-purple-50 text-purple-700 px-2 py-0.5 rounded font-semibold border border-purple-200">
                          {result.blockchainRecord.authorPseudonym}
                        </span>
                      </div>

                      <div className="pt-1">
                        <span className="text-slate-500 font-medium block mb-1">
                          Immutable SHA-256 Checksum:
                        </span>
                        <HashViewer hash={result.blockchainRecord.onChainHash} type="fileHash" truncate={false} />
                      </div>

                      <div className="pt-1">
                        <span className="text-slate-500 font-medium block mb-1">
                          Ethereum Transaction Receipt:
                        </span>
                        <HashViewer hash={result.blockchainRecord.txHash} type="txHash" truncate={false} />
                      </div>
                    </div>
                  )}
                </div>
              ) : result.matchStatus === 'HASH_MISMATCH' ? (
                <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 space-y-3 animate-fade-in">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                      <ShieldAlert className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-rose-950">
                        Checksum Discrepancy (Integrity Tampering Detected)
                      </h4>
                      <p className="text-xs text-rose-800 mt-0.5 leading-relaxed">
                        {result.message}
                      </p>
                    </div>
                  </div>

                  <div className="bg-white/80 rounded-xl p-3 border border-rose-200 text-xs space-y-2">
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
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-3 animate-fade-in">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-amber-950">
                      No Record Found on Blockchain
                    </h4>
                    <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
                      This paper or hash has not been registered on the conference smart contract
                      ledger.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
};
