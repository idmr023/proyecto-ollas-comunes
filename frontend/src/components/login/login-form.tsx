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

/* ── Validation schema ─────────────────────────────── */
const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'El correo es requerido')
    .email('Ingresa un correo válido'),
  password: z
    .string()
    .min(1, 'La contraseña es requerida')
    .min(6, 'Contraseña incorrecta'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

/* ── Component ─────────────────────────────────────── */
export function LoginForm() {
  const router = useRouter();
  const { setAuth } = useAuthStore();

  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  /* Demo stub — replace with real API call when backend is ready */
  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    try {
      // Paso 1: Simulación de verificación de cuenta
      await new Promise((r) => setTimeout(r, 600));

      // Pequeño retraso para UX antes de iniciar sesión
      await new Promise((resolve) => setTimeout(resolve, 600));

      // Paso 3: Inicialización de sesión
      setAuth({
        id: '1',
        name: 'Admin Demo',
        email: data.email,
        username: data.email.split('@')[0],
      });
      toast.success('Sesión iniciada correctamente');
      
      // Paso 4: Finalizar y usar router.replace para no quedar atascado al usar 'Atrás'
      setTimeout(() => {
        router.replace('/workspace/home');
      }, 1200);
      
    } catch {
      setIsLoading(false);
      toast.error('Usuario o contraseña incorrectos.');
    }
    // NOTA: No se usa finally para poner isLoading en false
    // para que el botón siga cargando hasta que termine la navegación.
  };

  return (
    /* ── Full-screen split container ── */
    <div className="flex min-h-screen w-full">

      {/* ══ LEFT PANEL — Verde Bosque ══════════════════════════════ */}
      <div
        className="relative hidden lg:flex lg:w-[60%] flex-col justify-between p-10 overflow-hidden"
        style={{
          background:
            'linear-gradient(145deg, var(--primary) 0%, var(--sidebar) 60%, var(--background) 100%)',
        }}
      >
        {/* Decorative background circles */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
        >
          <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full opacity-10 bg-highlight" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full opacity-5 bg-primary-foreground" />
          <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full opacity-10 bg-accent" />
          {/* Grid pattern */}
          <svg
            className="absolute inset-0 h-full w-full opacity-[0.04]"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <pattern
                id="grid"
                width="40"
                height="40"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 40 0 L 0 0 0 40"
                  fill="none"
                  stroke="white"
                  strokeWidth="1"
                />
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
            <br />
            <span className="text-highlight">
              con eficiencia y calidez.
            </span>
          </h2>
          <p className="max-w-sm text-base leading-relaxed text-primary-foreground/80">
            Controla beneficiarios, raciones, inventario y reportes
            desde un solo lugar. Hecho para las comunidades del Perú.
          </p>
        </div>

        {/* Bottom tagline */}
        <div className="relative text-xs text-primary-foreground/60">
          © {new Date().getFullYear()} Ollas Comunes · Plataforma de gestión comunitaria
        </div>
      </div>

      {/* ══ RIGHT PANEL — Crema / formulario ═══════════════════════ */}
      <div className="relative flex w-full lg:w-[40%] flex-col items-center justify-center px-5 py-10 sm:px-10 bg-background min-h-dvh">
        {/* Decorative gradient overlay on mobile only */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-primary/5 to-transparent lg:hidden"
        />
        <div className="relative w-full max-w-sm">

          <div className="mb-8 flex items-center justify-center gap-2 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-sm">
              <UtensilsCrossed className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold font-heading text-foreground">
              Ollas Comunes
            </span>
          </div>

          <div className="mb-8 text-center lg:text-left">
            <h1 className="text-2xl font-bold tracking-tight font-heading text-foreground">
              Bienvenido de vuelta
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Ingresa tus credenciales para continuar
            </p>
          </div>

          {/* Form */}
          <form
            id="login-form"
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-5"
            noValidate
          >
            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <Label
                htmlFor="login-email"
                className="text-sm font-medium text-foreground"
              >
                Correo electrónico
              </Label>
              <Input
                id="login-email"
                type="email"
                placeholder="correo@ejemplo.com"
                autoComplete="email"
                aria-invalid={!!errors.email}
                className="h-11 md:h-10 text-sm bg-card"
                {...register('email')}
              />
              {errors.email && (
                <p
                  role="alert"
                  className="text-xs text-destructive"
                >
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="login-password"
                  className="text-sm font-medium text-foreground"
                >
                  Contraseña
                </Label>
                <button
                  type="button"
                  className="text-xs sm:text-sm font-medium transition-colors hover:underline text-accent"
                  tabIndex={-1}
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
              <div className="relative">
              <Input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                autoComplete="current-password"
                aria-invalid={!!errors.password}
                className="h-11 md:h-10 pr-10 text-sm bg-card"
                {...register('password')}
              />
                <button
                  type="button"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-70 text-muted-foreground"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p
                  role="alert"
                  className="text-xs text-destructive"
                >
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* CTA */}
            <Button
              id="login-submit"
              type="submit"
              disabled={isLoading}
              className="mt-1 h-12 md:h-11 w-full text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition-all"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Ingresando...
                </>
              ) : (
                'Iniciar sesión'
              )}
            </Button>
          </form>

          {/* ── Separator with "o" ── */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                o continúa con
              </span>
            </div>
          </div>

          {/* ── Google Sign-In ── */}
          <button
            type="button"
            disabled={isLoading}
            onClick={() => {
              toast.info('Integración con Google próximamente');
            }}
            className="flex w-full items-center justify-center gap-2.5 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground transition-all hover:bg-muted active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Iniciar sesión con Google
          </button>

          {/* Footer note */}
          <p className="mt-8 text-center text-xs text-muted-foreground">
            ¿Problemas para ingresar?{' '}
            <button
              type="button"
              className="font-medium text-accent underline transition-colors hover:text-accent/80"
            >
              Contacta al administrador
            </button>
          </p>
        </div>
      </div>

    </div>
  );
}
