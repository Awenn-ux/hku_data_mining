import axios, { AxiosInstance, AxiosError } from 'axios';
import type {
  ApiResponse,
  User,
  TokenResponse,
  ChatQueryRequest,
  ChatQueryResponse,
  Conversation,
  Document,
  EmailMessage,
  SystemStats,
} from '@/types';

class ApiService {
  private api: AxiosInstance;
  // Use relative path so frontend and backend can share the same origin
  private baseURL = import.meta.env.VITE_API_BASE_URL || '';

  constructor() {
    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor - attach token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - handle errors
    this.api.interceptors.response.use(
      (response) => response.data,
      async (error: AxiosError<ApiResponse>) => {
        if (error.response?.status === 401) {
          // 401: unauthenticated or expired session
          // Only redirect when the request is not /api/auth/me
          const isAuthCheck = error.config?.url?.includes('/api/auth/me');
          
          if (!isAuthCheck) {
            // Clear auth info and redirect on other 401 responses
            const refreshToken = localStorage.getItem('refresh_token');
            if (refreshToken) {
              try {
                const { data } = await this.refreshToken(refreshToken);
                localStorage.setItem('access_token', data.access_token);
                // Retry original request
                if (error.config) {
                  error.config.headers.Authorization = `Bearer ${data.access_token}`;
                  return this.api.request(error.config);
                }
              } catch {
                // Refresh failed — clear tokens and redirect
                this.clearAuth();
                window.location.href = '/login';
              }
            } else {
              this.clearAuth();
              window.location.href = '/login';
            }
          }
        }
        return Promise.reject(error.response?.data || error.message);
      }
    );
  }

  private clearAuth() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  }

  // ============ Auth API ============
  async getLoginUrl(): Promise<ApiResponse<{ auth_url: string }>> {
    return this.api.get('/api/auth/login');
  }

  async handleOAuthCallback(code: string): Promise<ApiResponse<{
    user: User;
    token: string;
  }>> {
    // Flask backend handles callback via GET, let browser process it
    return this.api.get(`/api/auth/callback?code=${code}`);
  }

  async getCurrentUser(): Promise<ApiResponse<User>> {
    return this.api.get('/api/auth/me');
  }

  async refreshToken(refreshToken: string): Promise<ApiResponse<TokenResponse>> {

    return Promise.reject('Not supported in simplified version');
  }

  async devLogin(): Promise<ApiResponse<{
    user: User;
    token: string;
  }>> {
    return this.api.post('/api/auth/dev-login');
  }

  async logout(): Promise<ApiResponse> {
    return this.api.post('/api/auth/logout');
  }

  // ============ Chat API ============
  async sendMessage(request: ChatQueryRequest): Promise<ApiResponse<ChatQueryResponse>> {

    return this.api.post('/api/chat/ask', {
      question: request.query || request.question,
    });
  }

  async getConversations(): Promise<ApiResponse<any[]>> {

    return this.api.get('/api/chat/history');
  }

  async getConversationDetail(id: string): Promise<ApiResponse<any>> {

    return Promise.reject('Not supported in simplified version');
  }

  async deleteConversation(id: string): Promise<ApiResponse> {

    return this.api.delete(`/api/chat/history/${id}`);
  }

  // ============ Knowledge API ============
  async uploadDocument(file: File): Promise<ApiResponse<Document>> {
    const formData = new FormData();
    formData.append('file', file);
    return this.api.post('/api/knowledge/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  async getDocuments(): Promise<ApiResponse<{ documents: Document[]; total: number }>> {
    return this.api.get('/api/knowledge/documents');
  }

  async getDocumentDetail(id: string): Promise<ApiResponse<Document>> {

    return Promise.reject('Not supported in simplified version');
  }

  async deleteDocument(id: string): Promise<ApiResponse> {
    return this.api.delete(`/api/knowledge/documents/${id}`);
  }

  async reprocessDocument(id: string): Promise<ApiResponse> {

    return Promise.reject('Not supported in simplified version');
  }

  async searchDocuments(query: string, topK: number = 5): Promise<ApiResponse> {

    return this.api.post('/api/knowledge/search', {
      query,
      top_k: topK,
    });
  }

  async getKnowledgeStats(): Promise<ApiResponse<{
    documents_count: number;
    vectors_count: number;
  }>> {
    return this.api.get('/api/knowledge/stats');
  }

  // ============ Email API ============
  async getEmailStatus(): Promise<ApiResponse<{
    connected: boolean;
    last_sync: string | null;
  }>> {
    return this.api.get('/api/email/status');
  }

  async getEmails(top: number = 50): Promise<ApiResponse<{
    emails: EmailMessage[];
    count: number;
  }>> {

    return this.api.get('/api/email/recent', {
      params: { top },
    });
  }

  async getEmailDetail(id: string): Promise<ApiResponse<EmailMessage>> {
    // Not supported for email detail
    return Promise.reject('Not supported in simplified version');
  }

  async searchEmails(keyword: string, top: number = 10): Promise<ApiResponse<{
    emails: EmailMessage[];
    count: number;
  }>> {
    // Use POST request
    return this.api.post('/api/email/search', {
      keyword,
      top,
    });
  }

  async getCalendarEvents(): Promise<ApiResponse> {
    // Calendar not available in simplified build
    return Promise.reject('Not supported in simplified version');
  }

  // ============ System API ============
  async getSystemHealth(): Promise<ApiResponse<{
    status: string;
    timestamp: string;
    version: string;
  }>> {
    return this.api.get('/api/health');
  }

  async getSystemStats(): Promise<ApiResponse<SystemStats>> {
    // System statistics not available
    return Promise.reject('Not supported in simplified version');
  }

  async getVersion(): Promise<ApiResponse<{
    service: string;
    version: string;
    status: string;
  }>> {
    return this.api.get('/');
  }
}

export const apiService = new ApiService();
export default apiService;

