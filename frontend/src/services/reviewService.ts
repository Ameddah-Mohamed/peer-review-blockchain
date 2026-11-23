import { apiClient } from './api';
import { mockAdapter } from './mockAdapter';
import { ReviewAssignment, ReviewScore, Recommendation, User } from '../types';

export const reviewService = {
  async getAssignedPapers(currentUser: User): Promise<ReviewAssignment[]> {
    try {
      const res = await apiClient.get<{ success: boolean; assignments: ReviewAssignment[] }>(
        '/reviews/assigned'
      );
      return res.assignments;
    } catch (err: any) {
      if (err.message === 'BACKEND_UNAVAILABLE' || apiClient.isMockMode()) {
        return mockAdapter.getAssignedReviews(currentUser.id);
      }
      throw err;
    }
  },

  async submitReview(
    data: {
      assignmentId: string;
      paperId: string;
      scores: ReviewScore;
      overallScore: number;
      recommendation: Recommendation;
      authorComments: string;
      confidentialComments?: string;
      reviewHash: string;
    },
    currentUser: User
  ) {
    try {
      const res = await apiClient.post<{ success: boolean; review: any }>('/reviews', data);
      return res.review;
    } catch (err: any) {
      if (err.message === 'BACKEND_UNAVAILABLE' || apiClient.isMockMode()) {
        return mockAdapter.submitReview({
          ...data,
          reviewer: currentUser,
        });
      }
      throw err;
    }
  },
};
