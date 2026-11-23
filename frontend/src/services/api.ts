/**
 * Central API Client for Research Paper Submission & Peer-Review Tracker
 * Seamlessly handles JWT tokens, base URL configuration, and isolated mock fallback
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const FORCE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getToken(): string | null {
    return localStorage.getItem('peer_review_auth_token');
  }

  private getHeaders(isFormData = false): HeadersInit {
    const headers: Record<string, string> = {};
    const token = this.getToken();

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }

    return headers;
  }

  public isMockMode(): boolean {
    return FORCE_MOCK;
  }

  public async request<T>(
    endpoint: string,
    options: RequestInit = {},
    isFormData = false
  ): Promise<T> {
    if (this.isMockMode()) {
      throw new Error('MOCK_FALLBACK_TRIGGERED');
    }

    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${this.baseUrl}${cleanEndpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.getHeaders(isFormData),
          ...options.headers,
        },
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const errorMsg = data?.message || data?.error || `HTTP error ${response.status}`;
        const currentToken = this.getToken();
        if (
          (response.status === 401 || response.status === 403) &&
          (!currentToken || currentToken.startsWith('demo_') || currentToken.startsWith('mock_'))
        ) {
          throw new Error('BACKEND_UNAVAILABLE');
        }
        throw new Error(errorMsg);
      }

      return data as T;
    } catch (err: any) {
      // If network failed (e.g. backend server offline), we can signal fallback
      if (err.message === 'Failed to fetch' || err.name === 'TypeError') {
        throw new Error('BACKEND_UNAVAILABLE');
      }
      throw err;
    }
  }

  public get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  public post<T>(endpoint: string, body?: any, isFormData = false): Promise<T> {
    return this.request<T>(
      endpoint,
      {
        method: 'POST',
        body: isFormData ? body : JSON.stringify(body),
      },
      isFormData
    );
  }

  public patch<T>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }

  public delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient(BASE_URL);
