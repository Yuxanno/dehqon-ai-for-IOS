import { create } from 'zustand';
import type { User, ChatMessage, Product, Category } from '../types';

type Tab = 'marketplace' | 'ai' | 'profile';

interface AppState {
  // Navigation
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;

  // Auth
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;

  // Chat
  messages: ChatMessage[];
  isTyping: boolean;
  addMessage: (message: ChatMessage) => void;
  setTyping: (isTyping: boolean) => void;
  clearChat: () => void;

  // Products
  products: Product[];
  selectedCategory: Category | null;
  searchQuery: string;
  setProducts: (products: Product[]) => void;
  setSelectedCategory: (category: Category | null) => void;
  setSearchQuery: (query: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Navigation
  activeTab: 'marketplace',
  setActiveTab: (tab) => set({ activeTab: tab }),

  // Auth
  user: null,
  isAuthenticated: false,
  setUser: (user) => set({ user, isAuthenticated: !!user }),

  // Chat
  messages: [],
  isTyping: false,
  addMessage: (message) =>
    set((state) => {
      // Prevent duplicate welcome messages
      if (message.id === 'welcome' && state.messages.some(m => m.id === 'welcome')) {
        return state;
      }
      return { messages: [...state.messages, message] };
    }),
  setTyping: (isTyping) => set({ isTyping }),
  clearChat: () => set({ messages: [] }),

  // Products
  products: [],
  selectedCategory: null,
  searchQuery: '',
  setProducts: (products) => set({ products }),
  setSelectedCategory: (category) => set({ selectedCategory: category }),
  setSearchQuery: (query) => set({ searchQuery: query }),
}));
