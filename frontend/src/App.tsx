import { Database, LayoutPanelTop, Soup, Sparkles } from 'lucide-react'
import { Route, Routes } from 'react-router-dom'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'

function WelcomePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-6 py-12 sm:px-10">
      <section className="grid w-full gap-8 overflow-hidden rounded-[2rem] border border-border/70 bg-card/80 p-8 shadow-[0_24px_80px_rgba(85,62,24,0.12)] backdrop-blur sm:p-10 lg:grid-cols-[1.2fr_0.8fr] lg:p-14">
        <div className="space-y-6">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/8 px-4 py-2 text-sm font-medium text-primary">
            <Soup className="size-4" />
            SIGO-OLLAS
          </span>

          <div className="space-y-4">
            <h1 className="max-w-2xl text-4xl font-semibold tracking-[-0.04em] text-foreground sm:text-5xl lg:text-6xl">
              Base inicial lista para construir el proyecto a medida.
            </h1>
            <p className="max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
              El frontend ya quedó preparado con React, Vite, shadcn/ui y un set de librerías útiles. El backend incluye Express, TypeScript y Prisma, listo para conectarse a PostgreSQL.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              size="lg"
              onClick={() => toast.success('Frontend listo para empezar a iterar')}
            >
              Probar entorno
              <Sparkles className="size-4" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}>
              Ver stack base
              <LayoutPanelTop className="size-4" />
            </Button>
          </div>
        </div>

        <div className="grid gap-4 self-stretch">
          <article className="rounded-[1.5rem] border border-border/70 bg-background/75 p-5">
            <p className="text-sm font-medium text-muted-foreground">Frontend</p>
            <h2 className="mt-2 text-2xl font-semibold text-foreground">React + shadcn/ui</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Incluye Tailwind CSS, React Router, TanStack Query, React Hook Form, Zod, Sonner y Lucide para arrancar rápido sin acoplar aún la lógica del negocio.
            </p>
          </article>

          <article className="rounded-[1.5rem] border border-border/70 bg-secondary/40 p-5">
            <p className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Database className="size-4" />
              Backend
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-foreground">Express + Prisma</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              El servidor expone un endpoint de salud y ya trae configuración para usar `DATABASE_URL` con Prisma sobre PostgreSQL.
            </p>
          </article>
        </div>
      </section>
    </main>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<WelcomePage />} />
    </Routes>
  )
}

export default App
