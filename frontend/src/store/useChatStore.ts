import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { chatApi } from '../services/api';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  imageUrl?: string;
  createdAt: string;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
  synced?: boolean; // Track if synced with server
}

interface ChatStore {
  sessions: ChatSession[];
  currentSessionId: string | null;
  sidebarOpen: boolean;
  isLoading: boolean;
  
  // Actions
  createSession: (token?: string | null) => Promise<string>;
  deleteSession: (id: string, token?: string | null) => void;
  setCurrentSession: (id: string | null) => void;
  addMessage: (sessionId: string, message: ChatMessage, token?: string | null) => void;
  updateSessionTitle: (sessionId: string, title: string) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  getCurrentSession: () => ChatSession | null;
  loadFromServer: (token: string) => Promise<void>;
  setSessions: (sessions: ChatSession[]) => void;
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      sessions: [],
      currentSessionId: null,
      sidebarOpen: true,
      isLoading: false,

      createSession: async (token) => {
        const tempId = Date.now().toString();
        const now = new Date().toISOString();
        
        const newSession: ChatSession = {
          id: tempId,
          title: 'Yangi chat',
          messages: [],
          createdAt: now,
          updatedAt: now,
          synced: !token, // If no token, consider it synced (local only)
        };
        
        set((state) => ({
          sessions: [newSession, ...state.sessions],
          currentSessionId: tempId,
        }));

        // If no token, just return tempId
        if (!token) {
          return tempId;
        }

        // Try to sync with server
        try {
          const serverSession = await chatApi.createSession(token);
          // Update local session with server ID
          set((state) => ({
            sessions: state.sessions.map(s => 
              s.id === tempId 
                ? { ...s, id: serverSession.id, synced: true }
                : s
            ),
            currentSessionId: serverSession.id,
          }));
          return serverSession.id;
        } catch (err) {
          console.error('Failed to sync session:', err);
          // Mark as synced anyway to allow local usage
          set((state) => ({
            sessions: state.sessions.map(s => 
              s.id === tempId 
                ? { ...s, synced: true }
                : s
            ),
          }));
          return tempId;
        }
      },

      deleteSession: async (id, token) => {
        set((state) => ({
          sessions: state.sessions.filter((s) => s.id !== id),
          currentSessionId: state.currentSessionId === id ? null : state.currentSessionId,
        }));

        // Try to delete from server
        if (token) {
          try {
            await chatApi.deleteSession(token, id);
          } catch (err) {
            console.error('Failed to delete session from server:', err);
          }
        }
      },

      setCurrentSession: (id) => {
        set({ currentSessionId: id });
      },

      addMessage: async (sessionId, message, token) => {
        // Get session to check if synced
        const session = get().sessions.find(s => s.id === sessionId);
        
        set((state) => ({
          sessions: state.sessions.map((session) => {
            if (session.id === sessionId) {
              const updatedMessages = [...session.messages, message];
              let title = session.title;
              if (message.role === 'user' && session.messages.length === 0) {
                title = message.content.slice(0, 30) + (message.content.length > 30 ? '...' : '');
              }
              return {
                ...session,
                title,
                messages: updatedMessages,
                updatedAt: new Date().toISOString(),
              };
            }
            return session;
          }),
        }));

        // Sync message to server only if session is synced
        if (token && session?.synced) {
          try {
            await chatApi.addMessage(token, sessionId, {
              id: message.id,
              role: message.role,
              content: message.content,
              image_url: message.imageUrl,
              created_at: message.createdAt,
            });
          } catch (err) {
            console.error('Failed to sync message:', err);
          }
        }
      },

      updateSessionTitle: (sessionId, title) => {
        set((state) => ({
          sessions: state.sessions.map((session) =>
            session.id === sessionId ? { ...session, title } : session
          ),
        }));
      },

      toggleSidebar: () => {
        set((state) => ({ sidebarOpen: !state.sidebarOpen }));
      },

      setSidebarOpen: (open) => {
        set({ sidebarOpen: open });
      },

      getCurrentSession: () => {
        const { sessions, currentSessionId } = get();
        return sessions.find((s) => s.id === currentSessionId) || null;
      },

      loadFromServer: async (token) => {
        set({ isLoading: true });
        try {
          const serverSessions = await chatApi.getSessions(token);
          const sessions: ChatSession[] = serverSessions.map(s => ({
            id: s.id,
            title: s.title,
            messages: s.messages.map(m => ({
              id: m.id,
              role: m.role as 'user' | 'assistant',
              content: m.content,
              imageUrl: m.image_url,
              createdAt: m.created_at,
            })),
            createdAt: s.created_at,
            updatedAt: s.updated_at,
            synced: true,
          }));
          
          set({ sessions, isLoading: false });
        } catch (err) {
          console.error('Failed to load sessions:', err);
          set({ isLoading: false });
        }
      },

      setSessions: (sessions) => {
        set({ sessions });
      },
    }),
    {
      name: 'dehqonjon-chat-storage',
    }
  )
);
