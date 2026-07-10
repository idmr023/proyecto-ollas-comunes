'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getOrganization, updateOrganization } from '@/lib/organizations-api';
import {
  organizationCategoryOptions,
  Organization,
  OrganizationCategory,
} from '@/types/organization';

export default function OrganizationPropertiesClientPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    category: organizationCategoryOptions[0] as OrganizationCategory,
    location: '',
  });

  useEffect(() => {
    const loadOrganization = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const item = await getOrganization(params.slug);

        if (!item) {
          setError('Organizacion no encontrada.');
          return;
        }

        setOrganization(item);
        setForm({
          name: item.name,
          category: (organizationCategoryOptions.includes(
            item.category as OrganizationCategory,
          )
            ? item.category
            : organizationCategoryOptions[0]) as OrganizationCategory,
          location: item.location,
        });
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : 'No se pudieron cargar las propiedades.',
        );
      } finally {
        setIsLoading(false);
      }
    };

    void loadOrganization();
  }, [params.slug]);

  const handleSave = async () => {
    if (!organization) {
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      const updatedOrganization = await updateOrganization(organization.slug, {
        name: form.name.trim(),
        category: form.category,
        location: form.location.trim(),
      });

      if (!updatedOrganization) {
        setError('No se pudieron guardar los cambios.');
        return;
      }

      setIsConfirmOpen(false);
      router.push(`/workspace/organizaciones/${updatedOrganization.slug}`);
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : 'No se pudieron guardar los cambios.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <Button asChild variant="ghost" size="sm" className="w-fit">
          <Link href="/workspace/home">
            <ArrowLeft className="size-4" />
            Organizaciones
          </Link>
        </Button>
        <div className="rounded-2xl border border-border/90 bg-card px-5 py-8 text-sm text-muted-foreground shadow-sm">
          Cargando propiedades...
        </div>
      </div>
    );
  }

  if (!organization || error) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <Button asChild variant="ghost" size="sm" className="w-fit">
          <Link href="/workspace/home">
            <ArrowLeft className="size-4" />
            Organizaciones
          </Link>
        </Button>
        <div className="rounded-2xl border border-border/90 bg-card px-5 py-8 text-sm text-muted-foreground shadow-sm">
          {error ?? 'Organizacion no encontrada.'}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <Button asChild variant="ghost" size="sm" className="w-fit">
        <Link href={`/workspace/organizaciones/${organization.slug}`}>
          <ArrowLeft className="size-4" />
          Volver
        </Link>
      </Button>

      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold font-heading text-foreground">Editar organizacion</h1>
      </div>

      <div className="flex flex-col gap-5 rounded-2xl border border-border/90 bg-card px-5 py-5 shadow-sm">
        <div className="grid gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="organization-name">Nombre</Label>
            <Input
              id="organization-name"
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({ ...current, name: event.target.value }))
              }
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="organization-category">Categoria</Label>
            <select
              id="organization-category"
              value={form.category}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  category: event.target.value as OrganizationCategory,
                }))
              }
              className="h-10 rounded-xl border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/20"
            >
              {organizationCategoryOptions.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="organization-location">Ubicacion</Label>
            <Input
              id="organization-location"
              value={form.location}
              onChange={(event) =>
                setForm((current) => ({ ...current, location: event.target.value }))
              }
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="organization-code">Codigo</Label>
            <Input
              id="organization-code"
              value={organization.code}
              readOnly
              tabIndex={-1}
              className="cursor-not-allowed border-border bg-muted/55 text-muted-foreground"
            />
          </div>
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
          <Button asChild variant="ghost">
            <Link href={`/workspace/organizaciones/${organization.slug}`}>Cancelar</Link>
          </Button>
          <Button onClick={() => setIsConfirmOpen(true)} disabled={isSaving}>
            Guardar cambios
          </Button>
        </div>
      </div>

      {isConfirmOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/12 px-4 backdrop-blur-[1px]">
          <Card className="w-full max-w-md border-border/90 shadow-xl">
            <CardHeader>
              <CardTitle>Guardar cambios</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              <p className="text-sm text-muted-foreground">
                Se actualizaran los datos visibles de esta organizacion.
              </p>
              <div className="flex items-center justify-end gap-2">
                <Button variant="ghost" onClick={() => setIsConfirmOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={() => void handleSave()} disabled={isSaving}>
                  Guardar cambios
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
