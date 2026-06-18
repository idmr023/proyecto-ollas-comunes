'use client';

import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageShell } from '@/components/workspace/page-shell';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  getTenantAlerts,
  updateTenantAlert,
  TenantAlertRecord,
} from '@/lib/organizations-api';
import {
  Bell,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Clock,
  Building,
} from 'lucide-react';
import { toast } from 'sonner';

export default function AlertasPage() {
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<TenantAlertRecord[]>([]);

  // Filtros
  const [search, setSearch] = useState('');
  const [filterOlla, setFilterOlla] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('');
  const [filterStatus, setFilterStatus] = useState('open'); // Por defecto alertas abiertas

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const data = await getTenantAlerts();
      setAlerts(data);
    } catch (error) {
      toast.error('Error al cargar las alertas del sistema');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  const handleUpdateStatus = async (id: string, nextStatus: 'resolved' | 'dismissed') => {
    setActionLoadingId(id);
    try {
      const updated = await updateTenantAlert(id, nextStatus);
      if (updated) {
        setAlerts((prev) => prev.map((a) => (a.id === id ? updated : a)));
        toast.success(`Alerta ${nextStatus === 'resolved' ? 'resuelta' : 'descartada'} con éxito`);
      }
    } catch (error) {
      toast.error('No se pudo actualizar el estado de la alerta');
      console.error(error);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Obtener ollas únicas para el filtro
  const uniqueOllas = useMemo(() => {
    const names = new Set<string>();
    alerts.forEach((a) => {
      if (a.ollaName && a.ollaName !== 'Sistema') {
        names.add(a.ollaName);
      }
    });
    return Array.from(names).sort();
  }, [alerts]);

  // Filtrado de alertas
  const filteredAlerts = useMemo(() => {
    return alerts.filter((a) => {
      const matchesSearch =
        a.message.toLowerCase().includes(search.toLowerCase()) ||
        a.ollaName.toLowerCase().includes(search.toLowerCase()) ||
        a.alertType.toLowerCase().includes(search.toLowerCase());
      const matchesOlla = !filterOlla || a.ollaName === filterOlla;
      const matchesSeverity = !filterSeverity || a.severity === filterSeverity;
      const matchesStatus = !filterStatus || a.status === filterStatus;

      return matchesSearch && matchesOlla && matchesSeverity && matchesStatus;
    });
  }, [alerts, search, filterOlla, filterSeverity, filterStatus]);

  // Mapear tipos de alerta a textos limpios
  const getAlertTypeLabel = (type: string) => {
    switch (type) {
      case 'sync_conflict':
        return 'Conflicto de Sincronización 🔄';
      case 'new_beneficiary':
        return 'Nuevo Beneficiario 👤';
      case 'low_stock':
        return 'Stock Crítico 🛒';
      case 'unusual_consumption':
        return 'Consumo Inusual 📈';
      case 'missing_daily_report':
        return 'Reporte Faltante 📋';
      case 'high_priority_beneficiary':
        return 'Caso Prioritario 🚨';
      default:
        return type;
    }
  };

  return (
    <PageShell
      title="Bandeja de Alertas e Incidencias"
      description="Supervisa y gestiona conflictos de sincronización, reportes de bajo stock y alertas del sistema."
      width="wide"
    >
      <div className="flex flex-col gap-6">
        {/* Controles superiores */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          {/* Selector de Estado */}
          <div className="inline-flex h-11 items-center justify-center rounded-xl bg-muted/60 p-1 text-muted-foreground backdrop-blur-sm">
            <button
              onClick={() => setFilterStatus('open')}
              className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg px-4 py-1.5 text-sm font-medium transition-all ${
                filterStatus === 'open'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'hover:bg-background/40 hover:text-foreground'
              }`}
            >
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Abiertas
            </button>
            <button
              onClick={() => setFilterStatus('resolved')}
              className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg px-4 py-1.5 text-sm font-medium transition-all ${
                filterStatus === 'resolved'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'hover:bg-background/40 hover:text-foreground'
              }`}
            >
              <CheckCircle className="h-4 w-4 text-green-500" />
              Resueltas
            </button>
            <button
              onClick={() => setFilterStatus('dismissed')}
              className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg px-4 py-1.5 text-sm font-medium transition-all ${
                filterStatus === 'dismissed'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'hover:bg-background/40 hover:text-foreground'
              }`}
            >
              <XCircle className="h-4 w-4 text-muted-foreground" />
              Descartadas
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={loadAlerts}
            disabled={loading}
            className="self-start sm:self-auto rounded-xl gap-2 active:scale-95 transition-transform"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Actualizar Alertas
          </Button>
        </div>

        {/* Panel de Filtros */}
        <Card className="border-primary/5 shadow-sm bg-card/60 backdrop-blur-md">
          <CardContent className="p-4 flex flex-col gap-4 md:flex-row md:items-end">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="search-alert" className="text-xs font-semibold text-muted-foreground">
                Buscar en alertas
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                <Input
                  id="search-alert"
                  placeholder="Buscar por mensaje, olla común..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-10 rounded-xl"
                />
              </div>
            </div>

            <div className="w-full md:w-56 space-y-1.5">
              <Label htmlFor="olla-filter" className="text-xs font-semibold text-muted-foreground">
                Olla Común
              </Label>
              <select
                id="olla-filter"
                value={filterOlla}
                onChange={(e) => setFilterOlla(e.target.value)}
                className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none"
              >
                <option value="">Todas las ollas</option>
                <option value="Sistema">Sistema (General)</option>
                {uniqueOllas.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>

            <div className="w-full md:w-48 space-y-1.5">
              <Label htmlFor="severity-filter" className="text-xs font-semibold text-muted-foreground">
                Severidad
              </Label>
              <select
                id="severity-filter"
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value)}
                className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none"
              >
                <option value="">Todas las severidades</option>
                <option value="critical">Crítica</option>
                <option value="high">Alta</option>
                <option value="medium">Media</option>
                <option value="low">Baja</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Listado de Alertas */}
        <div className="space-y-4">
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-32 w-full rounded-2xl" />
              <Skeleton className="h-32 w-full rounded-2xl" />
              <Skeleton className="h-32 w-full rounded-2xl" />
            </div>
          ) : filteredAlerts.length === 0 ? (
            <Card className="border-primary/5 shadow-sm">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Bell className="h-10 w-10 text-muted-foreground/30 mb-3" />
                <p className="text-sm font-semibold text-muted-foreground">
                  No hay alertas {filterStatus === 'open' ? 'abiertas' : filterStatus === 'resolved' ? 'resueltas' : 'descartadas'}.
                </p>
                <p className="text-xs text-muted-foreground/85">
                  Todo está al día o puedes cambiar los filtros de búsqueda.
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredAlerts.map((a) => {
              // Color de severidad
              let severityBadge = '';
              switch (a.severity) {
                case 'critical':
                  severityBadge = 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
                  break;
                case 'high':
                  severityBadge = 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
                  break;
                case 'medium':
                  severityBadge = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
                  break;
                default:
                  severityBadge = 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
              }

              return (
                <Card
                  key={a.id}
                  className={`border border-primary/5 transition-all shadow-sm rounded-2xl hover:shadow-md ${
                    a.status === 'open' && a.severity === 'critical'
                      ? 'border-l-4 border-l-red-500'
                      : a.status === 'open' && a.severity === 'high'
                      ? 'border-l-4 border-l-orange-500'
                      : ''
                  }`}
                >
                  <CardHeader className="pb-2 flex flex-row items-start justify-between gap-4 space-y-0">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-primary">
                          {getAlertTypeLabel(a.alertType)}
                        </span>
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${severityBadge}`}>
                          {a.severity === 'critical' ? 'Crítica 🚨' : a.severity}
                        </span>
                      </div>
                      <CardTitle className="text-sm font-semibold flex items-center gap-2 mt-1">
                        <Building className="h-4 w-4 text-muted-foreground/60" />
                        {a.ollaName}
                      </CardTitle>
                    </div>

                    <div className="text-xs text-muted-foreground/80 flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      {new Date(a.detectedAt).toLocaleString('es-PE', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </CardHeader>
                  <CardContent className="pb-4">
                    <p className="text-sm text-foreground/90 leading-6">{a.message}</p>

                    {/* Resuelta por: */}
                    {a.status === 'resolved' && a.resolvedAt && (
                      <div className="mt-3 flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400 font-semibold bg-green-50 dark:bg-green-950/20 p-2 rounded-xl w-fit">
                        <CheckCircle className="h-4 w-4" />
                        Resuelta el{' '}
                        {new Date(a.resolvedAt).toLocaleString('es-PE', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    )}

                    {a.status === 'dismissed' && (
                      <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground font-semibold bg-muted px-2.5 py-1 rounded-xl w-fit">
                        <XCircle className="h-4 w-4" />
                        Alerta Descartada / Archivada
                      </div>
                    )}

                    {/* Acciones */}
                    {a.status === 'open' && (
                      <div className="mt-4 flex flex-wrap gap-2 border-t pt-3.5">
                        <Button
                          size="sm"
                          onClick={() => handleUpdateStatus(a.id, 'resolved')}
                          disabled={actionLoadingId !== null}
                          className="rounded-xl bg-green-600 hover:bg-green-700 text-white gap-1.5 active:scale-95 transition-transform"
                        >
                          <CheckCircle className="h-4 w-4" />
                          Marcar como Resuelta
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleUpdateStatus(a.id, 'dismissed')}
                          disabled={actionLoadingId !== null}
                          className="rounded-xl border hover:bg-muted text-muted-foreground hover:text-foreground gap-1.5"
                        >
                          <XCircle className="h-4 w-4" />
                          Descartar Alerta
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </PageShell>
  );
}
