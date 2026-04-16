'use client';

interface LoaderProps {
  isVisible: boolean;
}

/**
 * Loader — Componente temporal de carga global.
 * Se muestra mientras AuthInitializer valida la sesión.
 * TODO: Reemplazar con animación definitiva del design system.
 */
export function Loader({ isVisible }: LoaderProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        {/* Spinner */}
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-muted border-t-primary" />
        <p className="text-sm text-muted-foreground font-sans">Cargando...</p>
      </div>
    </div>
  );
}
