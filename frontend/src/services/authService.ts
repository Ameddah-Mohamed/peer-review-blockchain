import { apiClient } from './api';
import { mockAdapter } from './mockAdapter';
import { User, UserRole } from '../types';

export const authService = {
  async login(email: string, pass: string): Promise<{ token: string; user: User }> {
    try {
      const res = await apiClient.post<{ success: boolean; token: string; user: User }>('/auth/login', {
        email,
        password: pass,
      });
      return { token: res.token, user: res.user };
    } catch (err: any) {
      if (err.message === 'BACKEND_UNAVAILABLE' || apiClient.isMockMode()) {
        console.info('[Auth] Using isolated mock fallback for login');
        return mockAdapter.login(email, pass);
      }
      throw err;
    }
  },

  async register(data: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    affiliation?: string;
  }): Promise<{ token: string; user: User }> {
    try {
      const res = await apiClient.post<{ success: boolean; token: string; user: User }>('/auth/register', data);
      return { token: res.token, user: res.user };
    } catch (err: any) {
      if (err.message === 'BACKEND_UNAVAILABLE' || apiClient.isMockMode()) {
        console.info('[Auth] Using isolated mock fallback for register');
        return mockAdapter.register(data);
      }
      throw err;
    }
  },

  async getMe(): Promise<User> {
    const token = localStorage.getItem('peer_review_auth_token');
    if (!token) throw new Error('No authentication token found');

    try {
      const res = await apiClient.get<{ success: boolean; user: User }>('/auth/me');
      return res.user;
    } catch (err: any) {
      if (err.message === 'BACKEND_UNAVAILABLE' || apiClient.isMockMode()) {
        return mockAdapter.getCurrentUser(token);
      }
      throw err;
    }
  },
};
