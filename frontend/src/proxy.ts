import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Proteccion de rutas del lado del servidor (A-2).
 *
 * En Next 16 la convencion `middleware.ts` pasó a llamarse `proxy.ts`; la
 * funcion debe exportarse como `proxy`.
 *
 * Hasta ahora toda la autorizacion vivia en `AuthGuard`, un componente cliente:
 * la pagina se enviaba al navegador y solo despues de hidratar se redirigia.
 * Aqui la decision ocurre antes de renderizar nada.
 *
 * Alcance deliberado: solo comprueba que EXISTA una sesion, no la valida
 * criptograficamente. Verificar la firma exigiria el secreto JWT en el edge, y
 * duplicar ahi la logica de autorizacion invita a que ambas copias diverjan.
 * La autorizacion real la sigue haciendo el backend en cada peticion; esto
 * evita servir el armazon de paginas privadas a quien no ha iniciado sesion.
 */

const SESSION_COOKIE = 'sigo_session'

const LOGIN_PATH = '/login'

export function proxy(request: NextRequest) {
  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE)?.value)
  const { pathname, search } = request.nextUrl

  if (hasSession) {
    // Con sesion activa, la pantalla de login no aporta nada.
    if (pathname === LOGIN_PATH) {
      return NextResponse.redirect(new URL('/workspace/home', request.url))
    }
    return NextResponse.next()
  }

  const loginUrl = new URL(LOGIN_PATH, request.url)
  // Se conserva el destino para volver a el tras autenticarse.
  loginUrl.searchParams.set('next', `${pathname}${search}`)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  /**
   * Solo las areas privadas y el propio login.
   *
   * `/login/otp` queda FUERA a proposito: en ese punto el usuario todavia no
   * tiene cookie de sesion (esta a mitad del segundo factor), asi que incluirlo
   * lo expulsaria en bucle a /login.
   */
  matcher: ['/workspace/:path*', '/mobile/:path*', '/login'],
}
