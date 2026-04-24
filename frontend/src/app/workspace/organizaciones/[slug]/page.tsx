'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { getOrganization } from '@/lib/organizations-api';
import { formatOrganizationDate, Organization } from '@/types/organization';

export default function OrganizationPage() {
  const params = useParams<{ slug: string }>();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadOrganization = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const item = await getOrganization(params.slug);
        setOrganization(item);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : 'No se pudo cargar la organizacion.',
        );
      } finally {
        setIsLoading(false);
      }
    };

    void loadOrganization();
  }, [params.slug]);

  if (isLoading) {
    return (
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
        <Button asChild variant="ghost" size="sm" className="w-fit">
          <Link href="/workspace/home">
            <ArrowLeft className="size-4" />
            Volver
          </Link>
        </Button>
        <Card className="max-w-xl border-border/90 shadow-sm">
          <CardHeader>
            <CardTitle>Cargando organizacion...</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!organization || error) {
    return (
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
        <Button asChild variant="ghost" size="sm" className="w-fit">
          <Link href="/workspace/home">
            <ArrowLeft className="size-4" />
            Volver
          </Link>
        </Button>
        <Card className="max-w-xl border-border/90 shadow-sm">
          <CardHeader>
            <CardTitle>{error ?? 'Organizacion no encontrada'}</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
      <Button asChild variant="ghost" size="sm" className="w-fit">
        <Link href="/workspace/home">
          <ArrowLeft className="size-4" />
          Organizaciones
        </Link>
      </Button>

      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold font-heading text-foreground">{organization.name}</h1>
        <span className="text-sm text-muted-foreground">
          {organization.category} · {organization.location}
        </span>
      </div>

      <section className="flex flex-wrap items-center gap-3 rounded-2xl border border-border/90 bg-card px-4 py-3 shadow-sm">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Estado</span>
          <span className="rounded-full border border-border bg-muted/60 px-2.5 py-1 text-xs font-medium text-foreground">
            {organization.status}
          </span>
        </div>
        <Separator orientation="vertical" className="hidden h-5 md:block" />
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Modulo</span>
          <span className="rounded-full border border-border bg-muted/60 px-2.5 py-1 text-xs font-medium text-foreground">
            Beneficiarios
          </span>
        </div>
        <Separator orientation="vertical" className="hidden h-5 md:block" />
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Base</span>
          <span className="rounded-full border border-border bg-muted/60 px-2.5 py-1 text-xs font-medium text-foreground">
            Lista
          </span>
        </div>
        {organization.createdAt ? (
          <>
            <Separator orientation="vertical" className="hidden h-5 md:block" />
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Creado</span>
              <span className="rounded-full border border-border bg-muted/60 px-2.5 py-1 text-xs font-medium text-foreground">
                {formatOrganizationDate(organization.createdAt)}
              </span>
            </div>
          </>
        ) : null}
      </section>
    </div>
  );
}
