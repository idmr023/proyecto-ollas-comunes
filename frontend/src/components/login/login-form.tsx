'use client';

import { useState } from 'react';
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
  const [isTotpSetup, setIsTotpSetup] = useState(false);
  const [totpSecret, setTotpSecret] = useState('');
  const [qrCodeUri, setQrCodeUri] = useState('');

  /* ── React Hook Form for Step 1 ── */
  const loginForm = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });
  const { register, handleSubmit, formState: { errors } } = loginForm;

  /* ── React Hook Form for OTP ── */
  const otpForm = useForm<OtpFormValues>({ resolver: zodResolver(otpSchema) });
  const { register: otpRegister, handleSubmit: otpHandleSubmit, formState: { errors: otpErrors } } = otpForm;

  /* ── Step 1: email + password ── */
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

      if (json.status === 'TOTP_SETUP_REQUIRED') {
        setTempToken(json.tempToken);
        setMfaEmail(json.email);
        // Segundo paso: pedir al backend que genere/persista el secret. Solo
        // en este momento el secret se guarda en BD.
        const setupRes = await fetch(`${API_BASE}/api/auth/totp/setup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tempToken: json.tempToken }),
        });
        if (!setupRes.ok) {
          const err = await setupRes.json().catch(() => ({}));
          throw new Error(err.message ?? 'No se pudo iniciar la configuración TOTP.');
        }
        const setup = await setupRes.json();
        setTotpSecret(setup.secret);
        setQrCodeUri(setup.qrCodeUri);
        setIsTotpSetup(true);
        setStep('otp');
        setIsLoading(false);
        return;
      }

      if (json.status === 'MFA_PENDING') {
        setTempToken(json.tempToken);
        setMfaEmail(json.email);
        setIsTotpSetup(false);
        setStep('otp');
        setIsLoading(false);
        return;
      }

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

  /* ── Step 2: verify TOTP ── */
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
            </>
          )}

          {/* ══ OTP / TOTP Setup Step ══ */}
          {step === 'otp' && (
            <>
              <div className="mb-8 text-center lg:text-left">
                <h1 className="text-2xl font-bold tracking-tight font-heading text-foreground">
                  {isTotpSetup ? 'Configurar autenticación' : 'Verificación en dos pasos'}
                </h1>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  {isTotpSetup
                    ? 'Escanea el código QR con tu app de autenticación y luego ingresa el código de 6 dígitos'
                    : 'Ingresa el código de 6 dígitos de tu aplicación de autenticación para <strong>' + mfaEmail + '</strong>'
                  }
                </p>
              </div>

              {isTotpSetup && qrCodeUri && (
                <div className="mb-6 flex flex-col items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrCodeUri)}`}
                    alt="Código QR para autenticación"
                    className="h-48 w-48 rounded-lg border"
                  />
                  <details className="w-full">
                    <summary className="cursor-pointer text-center text-xs text-muted-foreground hover:text-foreground">
                      ¿No puedes escanear? Código manual
                    </summary>
                    <p className="mt-2 break-all rounded bg-muted p-2 font-mono text-xs text-foreground select-all">
                      {totpSecret}
                    </p>
                  </details>
                </div>
              )}

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
                  {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verificando...</> : (isTotpSetup ? 'Confirmar y entrar' : 'Verificar código')}
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
