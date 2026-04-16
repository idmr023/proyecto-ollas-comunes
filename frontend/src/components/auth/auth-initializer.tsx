'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth-store';

export default function AuthInitializer({ children }: { children: React.ReactNode }) {
  const setInitialized = useAuthStore((s) => s.setInitialized);

  useEffect(() => {
    // Al ser una Demo, no necesitamos validar JWTs ni cookies de sesión en este componente.
    // Zustand usa 'persist' para mantener el estado del usuario; marcamos como inicializado.
    setInitialized(true);
  }, [setInitialized]);

  // Usar React Fragment en vez de un div con opacity previene que Next.js App Router 
  // se quede colgado en estado "loading" durante la navegación Back/Forward y previene
  // el error de "Router action dispatched before initialization" de manera nativa.
  return <>{children}</>;
}
