'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createOrganization } from '@/lib/organizations-api';
import {
  organizationCategoryOptions,
  OrganizationCategory,
} from '@/types/organization';
import LocationAutocomplete from '@/components/location-autocomplete';

export default function NewOrganizationPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '',
    category: organizationCategoryOptions[0] as OrganizationCategory,
    location: '',
    latitude: null as number | null,
    longitude: null as number | null,
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateOrganization = async () => {
    if (!form.name.trim() || !form.location.trim()) {
      setError('Nombre, categoria y ubicacion son obligatorios.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      const organization = await createOrganization({
        name: form.name.trim(),
        category: form.category,
        location: form.location.trim(),
        latitude: form.latitude ?? null,
        longitude: form.longitude ?? null,
      });

      if (!organization) {
        setError('No se pudo crear la organizacion.');
        return;
      }

      router.push(`/workspace/organizaciones/${organization.slug}`);
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : 'No se pudo crear la organizacion.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <Button asChild variant="ghost" size="sm" className="w-fit">
        <Link href="/workspace/home">
          <ArrowLeft className="size-4" />
          Organizaciones
        </Link>
      </Button>

      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold font-heading text-foreground">Nueva organizacion</h1>
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
              placeholder="Municipalidad o programa"
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
            <LocationAutocomplete
              // onSelect recibe { address, lat, lng }
              onSelect={(v) =>
                setForm((current) => ({
                  ...current,
                  location: v.address,
                  latitude: v.lat ?? null,
                  longitude: v.lng ?? null,
                }))
              }
            />
          </div>
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
          <Button asChild variant="ghost">
            <Link href="/workspace/home">Cancelar</Link>
          </Button>
          <Button onClick={() => void handleCreateOrganization()} disabled={isSubmitting}>
            Crear organizacion
          </Button>
        </div>
      </div>
    </div>
  );
}
