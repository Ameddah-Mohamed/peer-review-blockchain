import { apiClient } from './api';
import { mockAdapter } from './mockAdapter';
import { VerificationResult } from '../types';

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
