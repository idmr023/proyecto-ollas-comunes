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
    .min(6, 'Mínimo 6 caracteres'),
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
      toast.error('Credenciales incorrectas. Intenta de nuevo.');
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
      <div className="flex w-full lg:w-[40%] flex-col items-center justify-center px-6 py-12 sm:px-10 bg-background">
        <div className="w-full max-w-sm">

          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
              <UtensilsCrossed className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold font-heading text-primary">
              Ollas Comunes
            </span>
          </div>

          <div className="mb-8">
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
                className="h-10 text-sm bg-card"
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
                  className="text-xs font-medium transition-colors hover:underline text-accent"
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
                  className="h-10 pr-10 text-sm bg-card"
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
              className="mt-1 h-11 w-full text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
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

          {/* Footer note */}
          <p
            className="mt-8 text-center text-xs text-muted-foreground"
          >
            ¿Problemas para ingresar? Contacta al administrador del sistema.
          </p>
        </div>
      </div>

    </div>
  );
}
