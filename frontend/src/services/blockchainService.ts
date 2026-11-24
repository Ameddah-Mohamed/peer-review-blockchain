import { apiClient } from './api';
import { mockAdapter } from './mockAdapter';
import { VerificationResult } from '../types';
import { calculateSHA256 } from '../utils/crypto';

export const blockchainService = {
  async verifyPaper(
    paperId?: string,
    fileHash?: string,
    version?: number
  ): Promise<VerificationResult> {
    try {
      const res = await apiClient.post<{ success: boolean; result: VerificationResult }>(
        '/blockchain/verify-paper',
        { paperId, fileHash, version }
      );
      return res.result;
    } catch (err: any) {
      if (err.message === 'BACKEND_UNAVAILABLE' || apiClient.isMockMode()) {
        return mockAdapter.verifyPaper(paperId, fileHash, version);
      }
      throw err;
    }
  },

  async verifyFile(file: File): Promise<VerificationResult> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await apiClient.post<{
        success: boolean;
        calculatedFileHash: string;
        verified: boolean;
        matchStatus: string;
        record: any;
      }>('/blockchain/verify-file', formData, true);

      if (res.verified && res.record) {
        return {
          verified: true,
          matchStatus: 'MATCH_CONFIRMED',
          calculatedHash: res.calculatedFileHash,
          blockchainRecord: {
            paperId: res.record.paperId,
            version: res.record.versionNumber,
            onChainHash: res.calculatedFileHash,
            authorPseudonym: res.record.authorPseudonym,
            blockNumber: res.record.blockchainBlockNumber,
            blockTimestamp: res.record.registrationDate,
            txHash: res.record.blockchainTxHash,
          },
        };
      }

      return {
        verified: false,
        matchStatus: (res.matchStatus as any) || 'RECORD_NOT_FOUND',
        calculatedHash: res.calculatedFileHash,
        message: 'No matching record found on the blockchain ledger for this document.',
      };
    } catch (err: any) {
      if (err.message === 'BACKEND_UNAVAILABLE' || apiClient.isMockMode()) {
        const hash = await calculateSHA256(file);
        return mockAdapter.verifyPaper(undefined, hash);
      }
      throw err;
    }
  },

  async getRecord(paperId: string) {
    try {
      const res = await apiClient.get<{ success: boolean; record: any }>(
        `/blockchain/record/${paperId}`
      );
      return res.record;
    } catch (err: any) {
      if (err.message === 'BACKEND_UNAVAILABLE' || apiClient.isMockMode()) {
        const paper = await mockAdapter.getPaperById(paperId);
        return {
          paperId: paper.id,
          pseudonym: paper.authorPseudonym,
          versions: paper.versions,
        };
      }
      throw err;
    }
  },
};
