import { apiClient } from './api';
import { mockAdapter } from './mockAdapter';
import { ConferenceStats, Paper, User, UserRole, BlockchainEvent, ReviewAssignment } from '../types';

export const adminService = {
  async getOverview(): Promise<ConferenceStats> {
    try {
      const res = await apiClient.get<{ success: boolean; stats: ConferenceStats }>('/admin/overview');
      return res.stats;
    } catch (err: any) {
      if (err.message === 'BACKEND_UNAVAILABLE' || apiClient.isMockMode()) {
        return mockAdapter.getAdminStats();
      }
      throw err;
    }
  },

  async getSubmissions(): Promise<Paper[]> {
    try {
      const res = await apiClient.get<{ success: boolean; papers: Paper[] }>('/admin/submissions');
      return res.papers;
    } catch (err: any) {
      if (err.message === 'BACKEND_UNAVAILABLE' || apiClient.isMockMode()) {
        return mockAdapter.getAllSubmissions();
      }
      throw err;
    }
  },

  async getUsers(): Promise<User[]> {
    try {
      const res = await apiClient.get<{ success: boolean; users: User[] }>('/admin/users');
      return res.users;
    } catch (err: any) {
      if (err.message === 'BACKEND_UNAVAILABLE' || apiClient.isMockMode()) {
        return mockAdapter.getAllUsers();
      }
      throw err;
    }
  },

  async updateUserRole(userId: string, role: UserRole): Promise<User> {
    try {
      const res = await apiClient.patch<{ success: boolean; user: User }>(`/admin/users/${userId}/role`, {
        role,
      });
      return res.user;
    } catch (err: any) {
      if (err.message === 'BACKEND_UNAVAILABLE' || apiClient.isMockMode()) {
        return mockAdapter.updateUserRole(userId, role);
      }
      throw err;
    }
  },

  async assignReviewer(paperId: string, reviewerId: string, adminUser: User): Promise<ReviewAssignment> {
    try {
      const res = await apiClient.post<{ success: boolean; assignment: ReviewAssignment }>(
        '/admin/assignments',
        { paperId, reviewerId }
      );
      return res.assignment;
    } catch (err: any) {
      if (err.message === 'BACKEND_UNAVAILABLE' || apiClient.isMockMode()) {
        return mockAdapter.assignReviewer(paperId, reviewerId, adminUser);
      }
      throw err;
    }
  },

  async makeDecision(
    paperId: string,
    decision: 'accepted' | 'rejected' | 'revision_requested',
    remarks: string,
    adminUser: User
  ): Promise<Paper> {
    try {
      const res = await apiClient.post<{ success: boolean; paper: Paper }>('/admin/decisions', {
        paperId,
        decision,
        remarks,
      });
      return res.paper;
    } catch (err: any) {
      if (err.message === 'BACKEND_UNAVAILABLE' || apiClient.isMockMode()) {
        return mockAdapter.makeDecision(paperId, decision, remarks, adminUser);
      }
      throw err;
    }
  },

  async getAuditTrail(): Promise<BlockchainEvent[]> {
    try {
      const res = await apiClient.get<{ success: boolean; events: BlockchainEvent[] }>(
        '/admin/audit-trail'
      );
      return res.events;
    } catch (err: any) {
      if (err.message === 'BACKEND_UNAVAILABLE' || apiClient.isMockMode()) {
        return mockAdapter.getAuditTrail();
      }
      throw err;
    }
  },
};
