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
  // 使用相对路径，这样前端和后端可以在同一个端口
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

    // 请求拦截器 - 添加 token
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

    // 响应拦截器 - 处理错误
    this.api.interceptors.response.use(
      (response) => response.data,
      async (error: AxiosError<ApiResponse>) => {
        if (error.response?.status === 401) {
          // Token 过期，尝试刷新
          const refreshToken = localStorage.getItem('refresh_token');
          if (refreshToken) {
            try {
              const { data } = await this.refreshToken(refreshToken);
              localStorage.setItem('access_token', data.access_token);
              // 重试原请求
              if (error.config) {
                error.config.headers.Authorization = `Bearer ${data.access_token}`;
                return this.api.request(error.config);
              }
            } catch {
              // 刷新失败，清除 token 并跳转登录
              this.clearAuth();
              window.location.href = '/login';
            }
          } else {
            this.clearAuth();
            window.location.href = '/login';
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

  // ============ 认证 API ============
  async getLoginUrl(): Promise<ApiResponse<{ auth_url: string }>> {
    return this.api.get('/api/auth/login');
  }

  async handleOAuthCallback(code: string): Promise<ApiResponse<{
    user: User;
    token: string;
  }>> {
    // Flask 后端的回调是 GET 请求，直接在浏览器中处理
    return this.api.get(`/api/auth/callback?code=${code}`);
  }

  async getCurrentUser(): Promise<ApiResponse<User>> {
    return this.api.get('/api/auth/me');
  }

  async refreshToken(refreshToken: string): Promise<ApiResponse<TokenResponse>> {
    // 简化版暂不支持独立的 refresh 接口，由后端自动处理
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

  // ============ 聊天 API ============
  async sendMessage(request: ChatQueryRequest): Promise<ApiResponse<ChatQueryResponse>> {
    // 简化版接口: POST /api/chat/ask
    return this.api.post('/api/chat/ask', {
      question: request.query || request.question,
    });
  }

  async getConversations(): Promise<ApiResponse<any[]>> {
    // 简化版改为获取历史记录
    return this.api.get('/api/chat/history');
  }

  async getConversationDetail(id: string): Promise<ApiResponse<any>> {
    // 简化版不支持单独获取会话详情
    return Promise.reject('Not supported in simplified version');
  }

  async deleteConversation(id: string): Promise<ApiResponse> {
    // 简化版: 删除历史记录
    return this.api.delete(`/api/chat/history/${id}`);
  }

  // ============ 知识库 API ============
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
    // 简化版不支持单独获取文档详情
    return Promise.reject('Not supported in simplified version');
  }

  async deleteDocument(id: string): Promise<ApiResponse> {
    return this.api.delete(`/api/knowledge/documents/${id}`);
  }

  async reprocessDocument(id: string): Promise<ApiResponse> {
    // 简化版不支持重新处理
    return Promise.reject('Not supported in simplified version');
  }

  async searchDocuments(query: string, topK: number = 5): Promise<ApiResponse> {
    // 简化版改为 POST 请求
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

  // ============ 邮件 API ============
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
    // 简化版: 获取最近邮件
    return this.api.get('/api/email/recent', {
      params: { top },
    });
  }

  async getEmailDetail(id: string): Promise<ApiResponse<EmailMessage>> {
    // 简化版不支持获取邮件详情
    return Promise.reject('Not supported in simplified version');
  }

  async searchEmails(keyword: string, top: number = 10): Promise<ApiResponse<{
    emails: EmailMessage[];
    count: number;
  }>> {
    // 简化版改为 POST 请求
    return this.api.post('/api/email/search', {
      keyword,
      top,
    });
  }

  async getCalendarEvents(): Promise<ApiResponse> {
    // 简化版不支持日历功能
    return Promise.reject('Not supported in simplified version');
  }

  // ============ 系统 API ============
  async getSystemHealth(): Promise<ApiResponse<{
    status: string;
    timestamp: string;
    version: string;
  }>> {
    return this.api.get('/api/health');
  }

  async getSystemStats(): Promise<ApiResponse<SystemStats>> {
    // 简化版不支持系统统计
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

