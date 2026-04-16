import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/types/auth';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  setAuth: (user: User) => void;
  clearAuth: () => void;
  setInitialized: (val: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isInitialized: false,
      setAuth: (user: User) => set({ user, isAuthenticated: true, isInitialized: true }),
      clearAuth: () => set({ user: null, isAuthenticated: false, isInitialized: true }),
      setInitialized: (val: boolean) => set({ isInitialized: val }),
    }),
    {
      name: 'auth-storage',
      // No persistimos isInitialized para forzar el chequeo en cada carga de página
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
