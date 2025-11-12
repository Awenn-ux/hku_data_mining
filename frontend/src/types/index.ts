// API 响应类型
export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
}

// 用户类型
export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  email_connected: boolean;
}

// Token 类型
export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

// 消息类型
export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: SourceInfo[];
  isStreaming?: boolean;
}

// 来源信息
export interface SourceInfo {
  type: 'knowledge_base' | 'email';
  title: string;
  content: string;
  relevance_score: number;
  metadata?: Record<string, any>;
}

// 对话类型
export interface Conversation {
  id: string;
  title: string;
  message_count: number;
  created_at: string;
  updated_at: string;
  messages?: Message[];
}

// 文档类型
export interface Document {
  id: string;
  filename: string;
  file_type: string;
  file_size: number;
  title?: string;
  description?: string;
  category?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  chunk_count: number;
  error_message?: string;
  created_at: string;
  updated_at: string;
  processed_at?: string;
}

// 邮件类型
export interface EmailMessage {
  id: string;
  message_id: string;
  subject: string;
  sender: string;
  sender_email: string;
  body_preview: string;
  body_content?: string;
  categories: string[];
  is_academic: boolean;
  importance: string;
  received_at: string;
  has_attachments: boolean;
  attachment_count?: number;
}

// 系统统计
export interface SystemStats {
  total_users: number;
  total_conversations: number;
  total_documents: number;
  total_emails: number;
  vector_count: number;
  uptime: string;
}

// 主题类型
export type Theme = 'light' | 'dark';

// 聊天请求
export interface ChatQueryRequest {
  question: string;
  conversation_id?: string;
}

// 聊天响应
export interface ChatQueryResponse {
  answer: string;
  sources: SourceInfo[];
  conversation_id: string;
}

