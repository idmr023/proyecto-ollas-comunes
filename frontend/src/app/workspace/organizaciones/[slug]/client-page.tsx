'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ArrowLeft, Plus } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Modal } from '@/components/shared/modal';
import { getOrganization } from '@/lib/organizations-api';
import { formatOrganizationDate, Organization } from '@/types/organization';
import { Olla, OllaFormValues } from '@/types/olla';
import { createOlla, listOllas } from '@/lib/ollas-api';
import LocationAutocomplete from '@/components/location-autocomplete';

function emptyOllaForm(): OllaFormValues {
  return {
    name: '',
    address: '',
    contactName: '',
    contactPhone: '',
    latitude: null,
    longitude: null,
  }
}

export default function OrganizationClientPage() {
  const params = useParams<{ slug: string }>();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [ollas, setOllas] = useState<Olla[]>([]);
  const [ollasLoading, setOllasLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<OllaFormValues>(emptyOllaForm());
  const [saving, setSaving] = useState(false);

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

  useEffect(() => {
    const loadOllas = async () => {
      try {
        setOllasLoading(true);
        const items = await listOllas(params.slug);
        setOllas(items);
      } catch {
        // Non-critical error
      } finally {
        setOllasLoading(false);
      }
    };

    if (!isLoading && organization) {
      void loadOllas();
    }
  }, [params.slug, isLoading, organization]);

  function openCreateModal() {
    setForm(emptyOllaForm())
    setModalOpen(true)
  }

  function updateFormField<K extends keyof OllaFormValues>(
    key: K,
    value: OllaFormValues[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSave() {
    if (!form.name.trim()) {
      toast.error('El nombre de la olla comun es obligatorio.')
      return
    }

    setSaving(true)
    try {
      const payload: OllaFormValues = {
        name: form.name.trim(),
        address: form.address?.trim() || undefined,
        contactName: form.contactName?.trim() || undefined,
        contactPhone: form.contactPhone?.trim() || undefined,
        estimatedDailyCapacity: form.estimatedDailyCapacity || undefined,
        latitude: form.latitude ?? null,
        longitude: form.longitude ?? null,
      }
      await createOlla(params.slug, payload)
      toast.success('Olla comun creada correctamente.')
      setModalOpen(false)
      const items = await listOllas(params.slug)
      setOllas(items)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al crear olla comun.')
    } finally {
      setSaving(false)
    }
  }

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
          {organization.category} &middot; {organization.location}
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

      {/* Ollas Comunes Section */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl font-bold font-heading text-foreground">Ollas Comunes</h2>
          <Button size="sm" onClick={openCreateModal}>
            <Plus className="mr-1 size-4" />
            Crear Olla
          </Button>
        </div>

        {ollasLoading && (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        )}

        {!ollasLoading && ollas.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">No hay ollas comunes registradas.</p>
              <Button variant="outline" className="mt-3" onClick={openCreateModal}>
                Crear primera olla comun
              </Button>
            </CardContent>
          </Card>
        )}

        {!ollasLoading && ollas.length > 0 && (
          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50 text-left text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Codigo</th>
                  <th className="px-4 py-3 font-medium">Nombre</th>
                  <th className="px-4 py-3 font-medium">Contacto</th>
                  <th className="px-4 py-3 font-medium">Capacidad</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 font-medium">Direccion</th>
                </tr>
              </thead>
              <tbody>
                {ollas.map((olla) => (
                  <tr key={olla.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs">{olla.code}</td>
                    <td className="px-4 py-3 font-medium">{olla.name}</td>
                    <td className="px-4 py-3">
                      {olla.contactName ? (
                        <div className="flex flex-col text-xs">
                          <span>{olla.contactName}</span>
                          {olla.contactPhone && (
                            <span className="text-muted-foreground">{olla.contactPhone}</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">&mdash;</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {olla.estimatedDailyCapacity
                        ? `${olla.estimatedDailyCapacity} raciones`
                        : <span className="text-muted-foreground">&mdash;</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        olla.status === 'Activa'
                          ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                          : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                      }`}>
                        {olla.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground max-w-[200px] truncate">
                      {olla.address ?? <span className="text-muted-foreground">&mdash;</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Create Olla Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Crear Olla Comun"
        maxWidth="max-w-lg"
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="olla-name">Nombre *</Label>
            <Input
              id="olla-name"
              value={form.name}
              onChange={(e) => updateFormField('name', e.target.value)}
              placeholder="Ej: Olla Comun Villa Maria"
            />
          </div>

          <div>
            <Label htmlFor="olla-address">Direccion</Label>
            <Input
              id="olla-address"
              value={form.address ?? ''}
              onChange={(e) => updateFormField('address', e.target.value)}
              placeholder="Ej: Av. Principal 123"
            />
          </div>

          <div>
            <Label>Ubicacion en el mapa</Label>
            <LocationAutocomplete
              onSelect={(v) =>
                setForm((prev) => ({
                  ...prev,
                  address: v.address || prev.address,
                  latitude: v.lat ?? null,
                  longitude: v.lng ?? null,
                }))
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="olla-contact">Nombre de Contacto</Label>
              <Input
                id="olla-contact"
                value={form.contactName ?? ''}
                onChange={(e) => updateFormField('contactName', e.target.value)}
                placeholder="Ej: Maria Lopez"
              />
            </div>
            <div>
              <Label htmlFor="olla-phone">Telefono de Contacto</Label>
              <Input
                id="olla-phone"
                value={form.contactPhone ?? ''}
                onChange={(e) => updateFormField('contactPhone', e.target.value)}
                placeholder="Ej: 999888777"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="olla-capacity">Capacidad Diaria Estimada (raciones)</Label>
            <Input
              id="olla-capacity"
              type="number"
              min={0}
              value={form.estimatedDailyCapacity ?? ''}
              onChange={(e) => updateFormField('estimatedDailyCapacity', e.target.value ? Number(e.target.value) : undefined)}
              placeholder="Ej: 150"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Creando...' : 'Crear Olla Comun'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
