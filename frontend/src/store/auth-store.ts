import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { User } from '@/types/auth'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isInitialized: boolean
  setAuth: (user: User, token: string) => void
  setToken: (token: string) => void
  clearAuth: () => void
  setInitialized: (val: boolean) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isInitialized: false,
      setAuth: (user, token) =>
        set({ user, token, isAuthenticated: true, isInitialized: true }),
      setToken: (token) => set({ token }),
      clearAuth: () =>
        set({ user: null, token: null, isAuthenticated: false, isInitialized: true }),
      setInitialized: (val: boolean) => set({ isInitialized: val }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
)
