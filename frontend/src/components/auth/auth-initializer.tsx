'use client';

import { useEffect, useState } from 'react';
import { getCookie, deleteCookie } from 'cookies-next';
import { jwtDecode } from 'jwt-decode';
import { useAuthStore } from '@/store/auth-store';
import { Loader } from '@/components/general/loader';
import { JWTPayload } from '@/types/auth';

export default function AuthInitializer({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isInitialized, setAuth, clearAuth, setInitialized } = useAuthStore();

  useEffect(() => {
    const validateSession = () => {
      const token = getCookie('auth_token');
      
      if (token) {
        try {
          const decoded = jwtDecode<JWTPayload>(token as string);
          const currentTime = Math.floor(Date.now() / 1000);

          // Real-time expiration check based on JWT "exp"
          if (decoded.exp < currentTime) {
            console.warn('Session expired based on JWT exp');
            deleteCookie('auth_token');
            clearAuth();
            setInitialized(true);
            return;
          }

          // Hydrate store with real data from token if not already authenticated
          if (!isAuthenticated) {
            setAuth({
              id: decoded.nameid,
              name: decoded.unique_name,
              email: decoded.email,
              username: decoded.upn,
            });
          }
        } catch (error) {
          console.error('Invalid token found:', error);
          deleteCookie('auth_token');
          clearAuth();
        }
      } else {
        if (isAuthenticated) {
          clearAuth();
        }
      }
      setInitialized(true);
    };

    validateSession();
  }, [isAuthenticated, setAuth, clearAuth, setInitialized]);

  // Redirections are now handled by middleware.ts for better security.
  // This component now only handles store hydration and session validation state.

  if (!isInitialized) {
    return <Loader isVisible={true} />;
  }

  return <>{children}</>;
}
