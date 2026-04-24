'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowUpDown,
  ChevronDown,
  Copy,
  Eye,
  LayoutGrid,
  List,
  MoreVertical,
  PencilLine,
  Plus,
  Search,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  listOrganizations,
  updateOrganizationStatus,
} from '@/lib/organizations-api';
import {
  formatOrganizationDate,
  Organization,
  OrganizationStatus,
} from '@/types/organization';
import { toast } from 'sonner';

export default function HomePage() {
  const router = useRouter();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Todas' | OrganizationStatus>('Todas');
  const [sortBy, setSortBy] = useState<'name' | 'recent'>('name');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [visibleFields, setVisibleFields] = useState({
    status: true,
    category: true,
    location: true,
    created: true,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busySlug, setBusySlug] = useState<string | null>(null);

  const loadOrganizations = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const items = await listOrganizations();
      setOrganizations(items);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'No se pudieron cargar las organizaciones.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadOrganizations();
  }, []);

  const visibleOrganizations = useMemo(() => {
    const filtered = organizations.filter((organization) => {
      const matchesQuery = [
        organization.name,
        organization.category,
        organization.location,
        organization.code,
      ]
        .join(' ')
        .toLowerCase()
        .includes(query.toLowerCase());

      const matchesStatus =
        statusFilter === 'Todas' ? true : organization.status === statusFilter;

      return matchesQuery && matchesStatus;
    });

    if (sortBy === 'recent') {
      return [...filtered].sort((firstOrganization, secondOrganization) => {
        const firstDate = firstOrganization.createdAt
          ? new Date(firstOrganization.createdAt).getTime()
          : 0;
        const secondDate = secondOrganization.createdAt
          ? new Date(secondOrganization.createdAt).getTime()
          : 0;

        return secondDate - firstDate;
      });
    }

    return [...filtered].sort((firstOrganization, secondOrganization) =>
      firstOrganization.name.localeCompare(secondOrganization.name, 'es'),
    );
  }, [organizations, query, sortBy, statusFilter]);

  const listColumnTemplate = useMemo(() => {
    const columns = ['minmax(260px,2.2fr)'];

    if (visibleFields.status) {
      columns.push('120px');
    }

    if (visibleFields.category) {
      columns.push('160px');
    }

    if (visibleFields.location) {
      columns.push('170px');
    }

    if (visibleFields.created) {
      columns.push('132px');
    }

    columns.push('52px');

    return columns.join(' ');
  }, [visibleFields]);

  const toggleVisibleField = (field: keyof typeof visibleFields) => {
    setVisibleFields((currentFields) => ({
      ...currentFields,
      [field]: !currentFields[field],
    }));
  };

  const handleCopyCode = async (event: React.MouseEvent, code: string) => {
    event.stopPropagation();
    try {
      await navigator.clipboard.writeText(code);
      toast.success('Codigo copiado.');
    } catch {
      toast.error('No se pudo copiar desde este navegador.');
    }
  };

  const handleOpenOrganization = (slug: string) => {
    router.push(`/workspace/organizaciones/${slug}`);
  };

  const handleOpenProperties = (
    event: React.MouseEvent,
    organization: Organization,
  ) => {
    event.stopPropagation();
    router.push(`/workspace/organizaciones/${organization.slug}/propiedades`);
  };

  const handleToggleStatus = async (
    event: React.MouseEvent,
    organization: Organization,
  ) => {
    event.stopPropagation();
    const nextStatus: OrganizationStatus =
      organization.status === 'Inactiva' ? 'Activa' : 'Inactiva';

    try {
      setBusySlug(organization.slug);
      const updatedOrganization = await updateOrganizationStatus(
        organization.slug,
        nextStatus,
      );

      if (!updatedOrganization) {
        return;
      }

      setOrganizations((currentOrganizations) =>
        currentOrganizations.map((currentOrganization) =>
          currentOrganization.slug === organization.slug
            ? updatedOrganization
            : currentOrganization,
        ),
      );
    } catch (statusError) {
      setError(
        statusError instanceof Error
          ? statusError.message
          : 'No se pudo actualizar el estado.',
      );
    } finally {
      setBusySlug(null);
    }
  };

  const renderActionsMenu = (organization: Organization) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className="relative z-10 shrink-0 rounded-full text-muted-foreground hover:text-foreground"
          onClick={(event) => event.stopPropagation()}
          onMouseDown={(event) => event.stopPropagation()}
          aria-label={`Opciones de ${organization.name}`}
        >
          <MoreVertical className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem onClick={(event) => void handleCopyCode(event, organization.code)}>
          <Copy className="size-4" />
          Copiar codigo
        </DropdownMenuItem>
        <DropdownMenuItem onClick={(event) => handleOpenProperties(event, organization)}>
          <PencilLine className="size-4" />
          Editar
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={(event) => void handleToggleStatus(event, organization)}
          disabled={busySlug === organization.slug}
        >
          {organization.status === 'Inactiva' ? 'Activar' : 'Desactivar'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const renderGridSubtitle = (organization: Organization) => {
    const subtitleParts = [
      visibleFields.category ? organization.category : null,
      visibleFields.location ? organization.location : null,
    ].filter(Boolean);

    if (subtitleParts.length === 0) {
      return null;
    }

    return (
      <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
        {subtitleParts.join(' · ')}
      </p>
    );
  };

  const renderGridMeta = (organization: Organization) => {
    if (!visibleFields.status && !visibleFields.created) {
      return null;
    }

    const alignmentClass =
      visibleFields.status && visibleFields.created
        ? 'justify-between'
        : visibleFields.created
          ? 'justify-end'
          : 'justify-start';

    return (
      <CardContent className={`mt-auto flex items-center pt-0 ${alignmentClass}`}>
        {visibleFields.status ? (
          <span className="rounded-full border border-border bg-muted/60 px-2.5 py-1 text-xs font-medium text-foreground">
            {organization.status}
          </span>
        ) : null}
        {visibleFields.created ? (
          <span className="text-xs text-muted-foreground">
            {formatOrganizationDate(organization.createdAt) || ' '}
          </span>
        ) : null}
      </CardContent>
    );
  };

  if (isLoading) {
    return (
      <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-5">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-3xl font-bold font-heading text-foreground">Organizaciones</h1>
        </div>
        <div className="rounded-2xl border border-border/90 bg-card px-4 py-8 text-sm text-muted-foreground shadow-sm">
          Cargando organizaciones...
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-5">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-bold font-heading text-foreground">Organizaciones</h1>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:gap-3 xl:flex-1">
            <div className="relative w-full xl:max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar organizacion"
                className="h-10 rounded-xl pl-9"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 xl:flex xl:items-center xl:gap-3 xl:w-auto">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full rounded-xl">
                    Estado
                    <ChevronDown className="size-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-44">
                  <DropdownMenuRadioGroup
                    value={statusFilter}
                    onValueChange={(value) =>
                      setStatusFilter(value as 'Todas' | OrganizationStatus)
                    }
                  >
                    <DropdownMenuRadioItem value="Todas">Todas</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="Activa">Activa</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="Inactiva">Inactiva</DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full rounded-xl">
                    <ArrowUpDown className="size-4 text-muted-foreground" />
                    Ordenar
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-44">
                  <DropdownMenuRadioGroup
                    value={sortBy}
                    onValueChange={(value) => setSortBy(value as 'name' | 'recent')}
                  >
                    <DropdownMenuRadioItem value="name">Por nombre</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="recent">Recientes</DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 xl:justify-end">
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon-sm"
                    className="shrink-0 rounded-xl"
                    aria-label="Elementos visibles"
                  >
                    <Eye className="size-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  <DropdownMenuLabel>Mostrar</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuCheckboxItem
                    checked={visibleFields.status}
                    onCheckedChange={() => toggleVisibleField('status')}
                  >
                    Estado
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={visibleFields.category}
                    onCheckedChange={() => toggleVisibleField('category')}
                  >
                    Categoria
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={visibleFields.location}
                    onCheckedChange={() => toggleVisibleField('location')}
                  >
                    Ubicacion
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={visibleFields.created}
                    onCheckedChange={() => toggleVisibleField('created')}
                  >
                    Creado
                  </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <div className="flex items-center rounded-xl border border-border bg-background p-1">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className={
                    viewMode === 'grid' ? 'bg-muted text-foreground' : 'text-muted-foreground'
                  }
                  onClick={() => setViewMode('grid')}
                  aria-label="Vista cuadricula"
                >
                  <LayoutGrid className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className={
                    viewMode === 'list' ? 'bg-muted text-foreground' : 'text-muted-foreground'
                  }
                  onClick={() => setViewMode('list')}
                  aria-label="Vista lista"
                >
                  <List className="size-4" />
                </Button>
              </div>
            </div>

            <Button asChild size="sm" className="rounded-xl px-3">
              <Link href="/workspace/organizaciones/nueva">
                <Plus className="size-4" />
                Nueva organizacion
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {error ? (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-border/90 bg-card px-4 py-3 text-sm text-muted-foreground shadow-sm">
          <span>{error}</span>
          <Button variant="outline" size="sm" onClick={() => void loadOrganizations()}>
            Reintentar
          </Button>
        </div>
      ) : null}

      {viewMode === 'grid' ? (
        <section className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,18rem),1fr))] gap-4">
          {visibleOrganizations.map((organization) => (
            <div key={organization.slug} className="group">
              <Card
                role="button"
                tabIndex={0}
                onClick={() => handleOpenOrganization(organization.slug)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    handleOpenOrganization(organization.slug);
                  }
                }}
                className="min-h-40 cursor-pointer border-border/90 shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md focus-visible:border-primary/40 focus-visible:outline-none"
              >
                <CardHeader className="flex min-h-28 flex-row items-start justify-between gap-3 pb-3">
                  <div className="min-w-0 flex-1">
                    <CardTitle className="line-clamp-2 text-base leading-snug">
                      {organization.name}
                    </CardTitle>
                    {renderGridSubtitle(organization)}
                  </div>
                  {renderActionsMenu(organization)}
                </CardHeader>
                {renderGridMeta(organization)}
              </Card>
            </div>
          ))}
        </section>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border/90 bg-card shadow-sm">
          <div className="overflow-x-auto [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border/80 [&::-webkit-scrollbar-track]:bg-transparent">
            <div className="min-w-[760px]">
              <div
                className="grid items-center gap-3 border-b border-border px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground"
                style={{ gridTemplateColumns: listColumnTemplate }}
              >
                <span>Organizacion</span>
                {visibleFields.status ? <span>Estado</span> : null}
                {visibleFields.category ? <span>Categoria</span> : null}
                {visibleFields.location ? <span>Ubicacion</span> : null}
                {visibleFields.created ? <span>Creado</span> : null}
                <span />
              </div>

              {visibleOrganizations.map((organization) => (
                <div
                  key={organization.slug}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleOpenOrganization(organization.slug)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      handleOpenOrganization(organization.slug);
                    }
                  }}
                  className="grid cursor-pointer items-center gap-3 border-b border-border px-4 py-3 transition-all last:border-b-0 hover:bg-muted/35 hover:shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.18)] focus-visible:bg-muted/35 focus-visible:outline-none"
                  style={{ gridTemplateColumns: listColumnTemplate }}
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {organization.name}
                    </p>
                  </div>
                  {visibleFields.status ? (
                    <div>
                      <span className="rounded-full border border-border bg-muted/60 px-2.5 py-1 text-xs font-medium text-foreground">
                        {organization.status}
                      </span>
                    </div>
                  ) : null}
                  {visibleFields.category ? (
                    <span className="truncate text-sm text-muted-foreground">
                      {organization.category}
                    </span>
                  ) : null}
                  {visibleFields.location ? (
                    <span className="truncate text-sm text-muted-foreground">
                      {organization.location}
                    </span>
                  ) : null}
                  {visibleFields.created ? (
                    <span className="truncate text-sm text-muted-foreground">
                      {formatOrganizationDate(organization.createdAt) || '—'}
                    </span>
                  ) : null}
                  <div className="justify-self-end">{renderActionsMenu(organization)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {visibleOrganizations.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/40 px-4 py-8 text-sm text-muted-foreground">
          No hay coincidencias para esa busqueda.
        </div>
      ) : null}
    </div>
  );
}
