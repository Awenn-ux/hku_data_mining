import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Message, Conversation, Document, Theme } from '@/types';

interface AppState {
  // 用户状态
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  
  // 主题
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  
  // 当前对话
  currentConversation: Conversation | null;
  messages: Message[];
  setCurrentConversation: (conversation: Conversation | null) => void;
  addMessage: (message: Message) => void;
  updateMessage: (id: string, content: string) => void;
  clearMessages: () => void;
  
  // 对话列表
  conversations: Conversation[];
  setConversations: (conversations: Conversation[]) => void;
  
  // 知识库
  documents: Document[];
  setDocuments: (documents: Document[]) => void;
  
  // UI 状态
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      // 初始状态
      user: null,
      isAuthenticated: false,
      theme: 'light',
      currentConversation: null,
      messages: [],
      conversations: [],
      documents: [],
      isSidebarOpen: true,
      isLoading: false,

      // 用户操作
      setUser: (user) =>
        set({
          user,
          isAuthenticated: !!user,
        }),

      // 主题操作
      toggleTheme: () =>
        set((state) => {
          const newTheme = state.theme === 'light' ? 'dark' : 'light';
          document.documentElement.classList.toggle('dark', newTheme === 'dark');
          return { theme: newTheme };
        }),

      setTheme: (theme) => {
        document.documentElement.classList.toggle('dark', theme === 'dark');
        set({ theme });
      },

      // 对话操作
      setCurrentConversation: (conversation) =>
        set({
          currentConversation: conversation,
          messages: conversation?.messages || [],
        }),

      addMessage: (message) =>
        set((state) => ({
          messages: [...state.messages, message],
        })),

      updateMessage: (id, content) =>
        set((state) => ({
          messages: state.messages.map((msg) =>
            msg.id === id ? { ...msg, content, isStreaming: false } : msg
          ),
        })),

      clearMessages: () =>
        set({
          messages: [],
          currentConversation: null,
        }),

      setConversations: (conversations) => set({ conversations }),

      // 知识库操作
      setDocuments: (documents) => set({ documents }),

      // UI 操作
      toggleSidebar: () =>
        set((state) => ({
          isSidebarOpen: !state.isSidebarOpen,
        })),

      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: 'hku-assistant-storage',
      partialize: (state) => ({
        user: state.user,
        theme: state.theme,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

