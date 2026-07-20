import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { User } from '@/types/auth'

interface AuthState {
  user: User | null
  /**
   * Token TEMPORAL del paso MFA (validez de 2 minutos), no la sesion.
   *
   * La sesion vive en una cookie `httpOnly` que JavaScript no puede leer. Este
   * campo solo cubre el tramo /login -> /login/otp, y a proposito NO se
   * persiste: al ser navegacion de cliente el estado en memoria sobrevive, y un
   * recargado completo obliga a repetir el login, que es lo correcto.
   */
  tempToken: string | null
  isAuthenticated: boolean
  isInitialized: boolean
  setAuth: (user: User) => void
  setTempToken: (token: string) => void
  clearAuth: () => void
  setInitialized: (val: boolean) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      tempToken: null,
      isAuthenticated: false,
      isInitialized: false,
      setAuth: (user) =>
        set({ user, tempToken: null, isAuthenticated: true, isInitialized: true }),
      setTempToken: (tempToken) => set({ tempToken }),
      clearAuth: () =>
        set({ user: null, tempToken: null, isAuthenticated: false, isInitialized: true }),
      setInitialized: (val: boolean) => set({ isInitialized: val }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => sessionStorage),
      /**
       * Solo datos de presentacion. Nunca credenciales: persistir el JWT aqui
       * es exactamente lo que permitia que un XSS se llevara la sesion entera.
       * `isAuthenticated` es una pista de UI, no una prueba de autorizacion:
       * quien decide es la cookie, validada en el servidor.
       */
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
)
