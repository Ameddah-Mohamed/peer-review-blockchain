import { apiClient } from './api';
import { mockAdapter } from './mockAdapter';
import { Paper, User } from '../types';

export const paperService = {
  async getMySubmissions(currentUser: User): Promise<Paper[]> {
    try {
      const res = await apiClient.get<{ success: boolean; papers: Paper[] }>('/papers/my-submissions');
      return res.papers;
    } catch (err: any) {
      if (err.message === 'BACKEND_UNAVAILABLE' || apiClient.isMockMode()) {
        return mockAdapter.getMySubmissions(currentUser.id);
      }
      throw err;
    }
  },

  async getPaperById(id: string): Promise<Paper> {
    try {
      const res = await apiClient.get<{ success: boolean; paper: Paper }>(`/papers/${id}`);
      return res.paper;
    } catch (err: any) {
      if (err.message === 'BACKEND_UNAVAILABLE' || apiClient.isMockMode()) {
        return mockAdapter.getPaperById(id);
      }
      throw err;
    }
  },

  async submitPaper(
    data: {
      title: string;
      abstract: string;
      track: string;
      keywords: string[];
      file: File;
      fileHash: string;
    },
    currentUser: User
  ): Promise<Paper> {
    try {
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('abstract', data.abstract);
      formData.append('track', data.track);
      formData.append('keywords', JSON.stringify(data.keywords));
      formData.append('fileHash', data.fileHash);
      formData.append('file', data.file);

      const res = await apiClient.post<{ success: boolean; paper: Paper }>('/papers', formData, true);
      return res.paper;
    } catch (err: any) {
      if (err.message === 'BACKEND_UNAVAILABLE' || apiClient.isMockMode()) {
        return mockAdapter.submitPaper({
          title: data.title,
          abstract: data.abstract,
          track: data.track,
          keywords: data.keywords,
          fileHash: data.fileHash,
          fileName: data.file.name,
          fileSize: data.file.size,
          user: currentUser,
        });
      }
      throw err;
    }
  },

  async submitVersion(
    paperId: string,
    data: {
      file: File;
      fileHash: string;
      changeLog: string;
    },
    currentUser: User
  ): Promise<Paper> {
    try {
      const formData = new FormData();
      formData.append('file', data.file);
      formData.append('fileHash', data.fileHash);
      formData.append('changeLog', data.changeLog);

      const res = await apiClient.post<{ success: boolean; paper: Paper }>(
        `/papers/${paperId}/versions`,
        formData,
        true
      );
      return res.paper;
    } catch (err: any) {
      if (err.message === 'BACKEND_UNAVAILABLE' || apiClient.isMockMode()) {
        return mockAdapter.submitNewVersion(paperId, {
          fileHash: data.fileHash,
          fileName: data.file.name,
          fileSize: data.file.size,
          changeLog: data.changeLog,
          user: currentUser,
        });
      }
      throw err;
    }
  },
};
