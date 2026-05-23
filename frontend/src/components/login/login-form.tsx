'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2, UtensilsCrossed } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/store/auth-store';

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ?? 'http://localhost:4000';

const GOOGLE_CLIENT_ID = '426312719449-p9vpi2f58c41l30op4bou84dpqk54hfi.apps.googleusercontent.com'

/* ── Step 1 schema ──────────────────────────── */
const loginSchema = z.object({
  email: z.string().min(1, 'El correo es requerido').email('Ingresa un correo válido'),
  password: z.string().min(1, 'La contraseña es requerida').min(6, 'Contraseña incorrecta'),
});
type LoginFormValues = z.infer<typeof loginSchema>;

/* ── OTP schema ─────────────────────────────── */
const otpSchema = z.object({
  code: z.string().regex(/^\d{6}$/, 'Ingresa un código de 6 dígitos'),
});
type OtpFormValues = z.infer<typeof otpSchema>;

export function LoginForm() {
  const router = useRouter();
  const { setAuth } = useAuthStore();

  /* state */
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  /* MFA state */
  const [step, setStep] = useState<'login' | 'otp'>('login');
  const [tempToken, setTempToken] = useState('');
  const [mfaEmail, setMfaEmail] = useState('');

  /* Google ref */
  const googleInitialized = useRef(false);

  /* ── React Hook Form for Step 1 ── */
  const loginForm = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });
  const { register, handleSubmit, formState: { errors } } = loginForm;

  /* ── React Hook Form for OTP ── */
  const otpForm = useForm<OtpFormValues>({ resolver: zodResolver(otpSchema) });
  const { register: otpRegister, handleSubmit: otpHandleSubmit, formState: { errors: otpErrors } } = otpForm;

  /* ── Load GIS library ── */
  useEffect(() => {
    if (googleInitialized.current || typeof window === 'undefined') return;
    googleInitialized.current = true;

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      const g = (window as any).google;
      if (g?.accounts?.id) {
        g.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleCredential,
          cancel_on_tap_outside: false,
        });
      }
    };
    document.head.appendChild(script);
  }, []);

  function handleGoogleCredential(response: any) {
    const credential = response?.credential;
    if (!credential) {
      toast.error('No se recibió la credencial de Google.');
      return;
    }
    googleLogin(credential);
  }

  async function googleLogin(credential: string) {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential }),
      });
      const json = await res.json();
      if (!json.ok || !json.token || !json.user) {
        throw new Error(json.message ?? 'Error al iniciar sesión con Google.');
      }
      setAuth(json.user, json.token);
      toast.success('Sesión iniciada con Google correctamente');
      setTimeout(() => router.replace('/workspace/home'), 1200);
    } catch (err) {
      setIsLoading(false);
      toast.error(err instanceof Error ? err.message : 'Error al iniciar sesión con Google.');
    }
  }

  /* ── Step 1: email + password → MFA_PENDING ── */
  async function onSubmit(data: LoginFormValues) {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email, password: data.password }),
      });
      const json = await res.json();

      if (!json.ok) {
        throw new Error(json.message ?? 'Credenciales inválidas.');
      }

      if (json.status === 'MFA_PENDING') {
        setTempToken(json.tempToken);
        setMfaEmail(json.email);
        setStep('otp');
        setIsLoading(false);
        return;
      }

      // Direct token (fallback for dev)
      if (json.token && json.user) {
        setAuth(json.user, json.token);
        toast.success('Sesión iniciada correctamente');
        setTimeout(() => router.replace('/workspace/home'), 1200);
        return;
      }

      throw new Error('Respuesta inesperada del servidor.');
    } catch (err) {
      setIsLoading(false);
      toast.error(err instanceof Error ? err.message : 'Error al iniciar sesión.');
    }
  }

  /* ── Step 2: verify OTP ── */
  async function onOtpSubmit(data: OtpFormValues) {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: mfaEmail, tempToken, code: data.code }),
      });
      const json = await res.json();

      if (!json.ok || !json.token || !json.user) {
        throw new Error(json.message ?? 'Código inválido.');
      }

      setAuth(json.user, json.token);
      toast.success('Sesión iniciada correctamente');
      setTimeout(() => router.replace('/workspace/home'), 1200);
    } catch (err) {
      setIsLoading(false);
      toast.error(err instanceof Error ? err.message : 'Error al verificar código.');
    }
  }

  function goBackToLogin() {
    setStep('login');
    setIsLoading(false);
  }

  /* ── Google button click ── */
  function handleGoogleClick() {
    if (isLoading) return;
    const g = (window as any).google;
    if (g?.accounts?.id) {
      g.accounts.id.prompt();
    } else {
      toast.error('La biblioteca de Google aún no se ha cargado. Intenta de nuevo.');
    }
  }

  return (
    <div className="flex min-h-screen w-full">
      {/* LEFT PANEL */}
      <div
        className="relative hidden lg:flex lg:w-[60%] flex-col justify-between p-10 overflow-hidden"
        style={{
          background:
            'linear-gradient(145deg, var(--primary) 0%, var(--sidebar) 60%, var(--background) 100%)',
        }}
      >
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full opacity-10 bg-highlight" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full opacity-5 bg-primary-foreground" />
          <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full opacity-10 bg-accent" />
          <svg className="absolute inset-0 h-full w-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>
        <div className="relative flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-highlight">
            <UtensilsCrossed className="h-5 w-5 text-sidebar-primary-foreground" />
          </div>
          <span className="text-xl font-bold tracking-tight font-heading text-primary-foreground">
            Ollas Comunes
          </span>
        </div>
        <div className="relative flex flex-col gap-6">
          <div className="h-1 w-12 rounded-full bg-highlight" />
          <h2 className="text-4xl font-bold leading-tight font-heading text-primary-foreground">
            Gestiona tu olla común
            <br /><span className="text-highlight">con eficiencia y calidez.</span>
          </h2>
          <p className="max-w-sm text-base leading-relaxed text-primary-foreground/80">
            Controla beneficiarios, raciones, inventario y reportes desde un solo lugar.
          </p>
        </div>
        <div className="relative text-xs text-primary-foreground/60">
          &copy; {new Date().getFullYear()} Ollas Comunes
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="relative flex w-full lg:w-[40%] flex-col items-center justify-center px-5 py-10 sm:px-10 bg-background min-h-dvh">
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-primary/5 to-transparent lg:hidden" />
        <div className="relative w-full max-w-sm">
          <div className="mb-8 flex items-center justify-center gap-2 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-sm">
              <UtensilsCrossed className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold font-heading text-foreground">Ollas Comunes</span>
          </div>

          {step === 'login' && (
            <>
              <div className="mb-8 text-center lg:text-left">
                <h1 className="text-2xl font-bold tracking-tight font-heading text-foreground">Bienvenido de vuelta</h1>
                <p className="mt-1.5 text-sm text-muted-foreground">Ingresa tus credenciales para continuar</p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="login-email" className="text-sm font-medium text-foreground">Correo electrónico</Label>
                  <Input id="login-email" type="email" placeholder="correo@ejemplo.com" autoComplete="email"
                    aria-invalid={!!errors.email} className="h-11 md:h-10 text-sm bg-card"
                    {...register('email')} />
                  {errors.email && <p role="alert" className="text-xs text-destructive">{errors.email.message}</p>}
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="login-password" className="text-sm font-medium text-foreground">Contraseña</Label>
                    <button type="button" className="text-xs sm:text-sm font-medium transition-colors hover:underline text-accent" tabIndex={-1}>¿Olvidaste tu contraseña?</button>
                  </div>
                  <div className="relative">
                    <Input id="login-password" type={showPassword ? 'text' : 'password'} placeholder="••••••••"
                      autoComplete="current-password" aria-invalid={!!errors.password}
                      className="h-11 md:h-10 pr-10 text-sm bg-card" {...register('password')} />
                    <button type="button" aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-70 text-muted-foreground" tabIndex={-1}>
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && <p role="alert" className="text-xs text-destructive">{errors.password.message}</p>}
                </div>

                <Button type="submit" disabled={isLoading}
                  className="mt-1 h-12 md:h-11 w-full text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition-all">
                  {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Ingresando...</> : 'Iniciar sesión'}
                </Button>
              </form>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">o continúa con</span>
                </div>
              </div>

              <button type="button" disabled={isLoading} onClick={handleGoogleClick}
                className="flex w-full items-center justify-center gap-2.5 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground transition-all hover:bg-muted active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed">
                <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Iniciar sesión con Google
              </button>

              <p className="mt-8 text-center text-xs text-muted-foreground">
                ¿Problemas para ingresar?{' '}
                <button type="button" className="font-medium text-accent underline transition-colors hover:text-accent/80">
                  Contacta al administrador
                </button>
              </p>
            </>
          )}

          {/* ══ OTP Step ══ */}
          {step === 'otp' && (
            <>
              <div className="mb-8 text-center lg:text-left">
                <h1 className="text-2xl font-bold tracking-tight font-heading text-foreground">Verificación en dos pasos</h1>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  Ingresa el código de 6 dígitos enviado a <strong>{mfaEmail}</strong>
                </p>
              </div>

              <form onSubmit={otpHandleSubmit(onOtpSubmit)} className="flex flex-col gap-5" noValidate>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="otp-code" className="text-sm font-medium text-foreground">Código de verificación</Label>
                  <Input id="otp-code" type="text" inputMode="numeric" maxLength={6} autoComplete="one-time-code"
                    placeholder="000000" className="h-11 md:h-10 text-lg text-center tracking-[8px] font-mono bg-card"
                    {...otpRegister('code')} />
                  {otpErrors.code && <p role="alert" className="text-xs text-destructive">{otpErrors.code.message}</p>}
                </div>

                <Button type="submit" disabled={isLoading}
                  className="mt-1 h-12 md:h-11 w-full text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition-all">
                  {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verificando...</> : 'Verificar código'}
                </Button>

                <button type="button" onClick={goBackToLogin} disabled={isLoading}
                  className="text-center text-xs text-muted-foreground underline transition-colors hover:text-foreground">
                  Volver al inicio de sesión
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
