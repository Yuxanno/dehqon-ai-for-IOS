import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UserRole = 'user' | 'seller' | 'admin';

export interface User {
  id: string;
  phone: string;
  name: string | null;
  username: string | null;
  avatarUrl: string | null;
  region: string | null;
  role: UserRole;
  sellerName: string | null;
  sellerType: string | null;
  isVerifiedSeller: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  
  // Actions
  setAuth: (user: User, token: string) => void;
  updateUser: (user: Partial<User>) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      setAuth: (user, token) => set({
        user,
        token,
        isAuthenticated: true,
      }),

      updateUser: (updates) => set((state) => ({
        user: state.user ? { ...state.user, ...updates } : null,
      })),

      logout: () => set({
        user: null,
        token: null,
        isAuthenticated: false,
      }),
    }),
    {
      name: 'dehqonjon-auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
