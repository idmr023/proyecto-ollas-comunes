import { logoutRequest } from './auth-api'

/**
 * Reaccion unificada a un 401.
 *
 * La cookie de sesion es `httpOnly`, asi que el cliente no puede borrarla por
 * su cuenta: hay que pedirselo al backend. Lo que si limpia aqui es el estado
 * de presentacion en `sessionStorage`, que de otro modo dejaria la interfaz
 * creyendo que hay sesion.
 */
export function handleUnauthorized(): void {
  if (typeof window === 'undefined') return

  try {
    const store = JSON.parse(sessionStorage.getItem('auth-storage') ?? '{}')
    if (!store.state?.isAuthenticated) return

    sessionStorage.removeItem('auth-storage')
    // No se espera la respuesta: la redireccion no debe depender de la red.
    void logoutRequest()
    window.location.href = '/login'
  } catch {
    // Un sessionStorage ilegible no debe impedir la redireccion.
  }
}
