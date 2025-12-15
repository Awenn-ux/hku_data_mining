import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Message, Conversation, Document, Theme } from '@/types';

interface AppState {
  // User state
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  
  // Theme
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  
  // Active conversation
  currentConversation: Conversation | null;
  messages: Message[];
  setCurrentConversation: (conversation: Conversation | null) => void;
  addMessage: (message: Message) => void;
  updateMessage: (id: string, content: string) => void;
  clearMessages: () => void;
  
  // Conversation list
  conversations: Conversation[];
  setConversations: (conversations: Conversation[]) => void;
  
  // Knowledge base
  documents: Document[];
  setDocuments: (documents: Document[]) => void;
  
  // UI state
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      theme: 'light',
      currentConversation: null,
      messages: [],
      conversations: [],
      documents: [],
      isSidebarOpen: true,
      isLoading: false,

      // User actions
      setUser: (user) =>
        set({
          user,
          isAuthenticated: !!user,
        }),

      // Theme actions
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

      // Conversation actions
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

      // Knowledge actions
      setDocuments: (documents) => set({ documents }),

      // UI actions
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

