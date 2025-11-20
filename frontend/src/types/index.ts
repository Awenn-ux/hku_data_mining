// API response type
export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
}

// User type
export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  email_connected: boolean;
}

// Token response
export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

// Message type
export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: SourceInfo[];
  isStreaming?: boolean;
}

// Source metadata
export interface SourceInfo {
  type: 'knowledge_base' | 'email';
  title: string;
  content: string;
  relevance_score: number;
  metadata?: Record<string, any>;
}

// Conversation
export interface Conversation {
  id: string;
  title: string;
  message_count: number;
  created_at: string;
  updated_at: string;
  messages?: Message[];
}

// Document metadata
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

// Email message
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

// System statistics
export interface SystemStats {
  total_users: number;
  total_conversations: number;
  total_documents: number;
  total_emails: number;
  vector_count: number;
  uptime: string;
}

// Theme
export type Theme = 'light' | 'dark';

// Chat request
export interface ChatQueryRequest {
  question: string;
  conversation_id?: string;
}

// Chat response
export interface ChatQueryResponse {
  answer: string;
  sources: SourceInfo[];
  conversation_id: string;
}

