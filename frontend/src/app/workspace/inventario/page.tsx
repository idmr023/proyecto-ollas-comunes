'use client';

import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageShell } from '@/components/workspace/page-shell';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  getTenantInventoryStock,
  getTenantInventoryMovements,
  TenantStockRecord,
  TenantMovementRecord,
} from '@/lib/organizations-api';
import {
  Boxes,
  History,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownLeft,
  Info,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';

export default function InventarioPage() {
  const [activeTab, setActiveTab] = useState<'stock' | 'movements'>('stock');
  const [loading, setLoading] = useState(true);
  const [stocks, setStocks] = useState<TenantStockRecord[]>([]);
  const [movements, setMovements] = useState<TenantMovementRecord[]>([]);

  // Filtros
  const [search, setSearch] = useState('');
  const [filterOlla, setFilterOlla] = useState('');
  const [filterMovementType, setFilterMovementType] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [stockData, movementData] = await Promise.all([
        getTenantInventoryStock(),
        getTenantInventoryMovements(),
      ]);
      setStocks(stockData);
      setMovements(movementData);
    } catch (error) {
      toast.error('Error al cargar la información del inventario');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Obtener ollas únicas para el filtro
  const uniqueOllas = useMemo(() => {
    const names = new Set<string>();
    stocks.forEach((s) => names.add(s.ollaName));
    movements.forEach((m) => names.add(m.ollaName));
    return Array.from(names).sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));
  }, [stocks, movements]);

  // Filtrado de stock
  const filteredStocks = useMemo(() => {
    return stocks.filter((s) => {
      const matchesSearch =
        s.supplyItemName.toLowerCase().includes(search.toLowerCase()) ||
        s.ollaName.toLowerCase().includes(search.toLowerCase()) ||
        s.categoryName.toLowerCase().includes(search.toLowerCase());
      const matchesOlla = !filterOlla || s.ollaName === filterOlla;
      return matchesSearch && matchesOlla;
    });
  }, [stocks, search, filterOlla]);

  // Filtrado de movimientos
  const filteredMovements = useMemo(() => {
    return movements.filter((m) => {
      const matchesSearch =
        m.supplyItemName.toLowerCase().includes(search.toLowerCase()) ||
        m.ollaName.toLowerCase().includes(search.toLowerCase()) ||
        (m.notes && m.notes.toLowerCase().includes(search.toLowerCase())) ||
        (m.sourceName && m.sourceName.toLowerCase().includes(search.toLowerCase()));
      const matchesOlla = !filterOlla || m.ollaName === filterOlla;
      const matchesType = !filterMovementType || m.movementType === filterMovementType;
      return matchesSearch && matchesOlla && matchesType;
    });
  }, [movements, search, filterOlla, filterMovementType]);

  return (
    <PageShell
      title="Monitoreo de Inventario"
      description="Consolidado de almacén y registro histórico de movimientos de todas las ollas comunes."
      width="wide"
    >
      <div className="flex flex-col gap-6">
        {/* Controles superiores y Pestañas */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          {/* Custom Tabs */}
          <div className="inline-flex h-11 items-center justify-center rounded-xl bg-muted/60 p-1 text-muted-foreground backdrop-blur-sm">
            <button
              onClick={() => setActiveTab('stock')}
              className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg px-4 py-1.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                activeTab === 'stock'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'hover:bg-background/40 hover:text-foreground'
              }`}
            >
              <Boxes className="h-4 w-4" />
              Stock por Olla
            </button>
            <button
              onClick={() => setActiveTab('movements')}
              className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg px-4 py-1.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                activeTab === 'movements'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'hover:bg-background/40 hover:text-foreground'
              }`}
            >
              <History className="h-4 w-4" />
              Kardex (Movimientos)
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={loading}
            className="self-start sm:self-auto rounded-xl gap-2 active:scale-95 transition-transform"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Actualizar datos
          </Button>
        </div>

        {/* Panel de Filtros */}
        <Card className="border-primary/5 shadow-sm bg-card/60 backdrop-blur-md">
          <CardContent className="p-4 flex flex-col gap-4 md:flex-row md:items-end">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="search" className="text-xs font-semibold text-muted-foreground">
                Buscar
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                <Input
                  id="search"
                  placeholder="Buscar por insumo, olla común..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-10 rounded-xl"
                />
              </div>
            </div>

            <div className="w-full md:w-56 space-y-1.5">
              <Label htmlFor="olla-filter" className="text-xs font-semibold text-muted-foreground">
                Filtrar por Olla
              </Label>
              <select
                id="olla-filter"
                value={filterOlla}
                onChange={(e) => setFilterOlla(e.target.value)}
                className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Todas las ollas</option>
                {uniqueOllas.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>

            {activeTab === 'movements' && (
              <div className="w-full md:w-48 space-y-1.5">
                <Label htmlFor="type-filter" className="text-xs font-semibold text-muted-foreground">
                  Tipo de Movimiento
                </Label>
                <select
                  id="type-filter"
                  value={filterMovementType}
                  onChange={(e) => setFilterMovementType(e.target.value)}
                  className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">Todos</option>
                  <option value="in">Ingresos (Entradas)</option>
                  <option value="out">Egresos (Salidas)</option>
                  <option value="adjustment">Ajustes</option>
                  <option value="waste">Mermas/Pérdidas</option>
                </select>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tab 1: Stock por Olla */}
        {activeTab === 'stock' && (
          <Card className="border-primary/5 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-bold">Resumen de Inventarios</CardTitle>
              <CardDescription>Insumos disponibles por cada olla común registrada.</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  <Skeleton className="h-10 w-full rounded-xl" />
                  <Skeleton className="h-10 w-full rounded-xl" />
                  <Skeleton className="h-10 w-full rounded-xl" />
                </div>
              ) : filteredStocks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <Boxes className="h-10 w-10 text-muted-foreground/40 mb-3" />
                  <p className="text-sm font-semibold text-muted-foreground">
                    No se encontraron insumos.
                  </p>
                  <p className="text-xs text-muted-foreground/85">
                    Intente cambiando el término de búsqueda o filtros.
                  </p>
                </div>
              ) : (
                <div className="relative overflow-x-auto rounded-xl border">
                  <table className="w-full text-left text-sm text-foreground">
                    <thead className="bg-muted/70 text-xs font-bold uppercase tracking-wider text-muted-foreground border-b">
                      <tr>
                        <th className="px-6 py-3.5">Olla Común</th>
                        <th className="px-6 py-3.5">Insumo</th>
                        <th className="px-6 py-3.5">Categoría</th>
                        <th className="px-6 py-3.5 text-right">Cantidad Disponible</th>
                        <th className="px-6 py-3.5 text-center">Estado de Stock</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filteredStocks.map((s, idx) => {
                        const isCritical = s.quantity > 0 && s.quantity < 5;
                        const isOut = s.quantity <= 0;

                        return (
                          <tr key={`${s.ollaId}-${s.supplyItemId}-${idx}`} className="hover:bg-muted/20 transition-colors">
                            <td className="px-6 py-4 font-medium">{s.ollaName}</td>
                            <td className="px-6 py-4">{s.supplyItemName}</td>
                            <td className="px-6 py-4">
                              <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-semibold text-muted-foreground">
                                {s.categoryName}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right font-bold">
                              {s.quantity} {s.unit}
                            </td>
                            <td className="px-6 py-4 text-center">
                              {isOut ? (
                                <span className="inline-flex items-center rounded-full bg-red-100 dark:bg-red-900/30 px-2.5 py-0.5 text-xs font-semibold text-red-800 dark:text-red-300">
                                  Sin Stock
                                </span>
                              ) : isCritical ? (
                                <span className="inline-flex items-center rounded-full bg-yellow-100 dark:bg-yellow-900/30 px-2.5 py-0.5 text-xs font-semibold text-yellow-800 dark:text-yellow-300">
                                  Bajo Stock ⚠️
                                </span>
                              ) : (
                                <span className="inline-flex items-center rounded-full bg-green-100 dark:bg-green-900/30 px-2.5 py-0.5 text-xs font-semibold text-green-800 dark:text-green-300">
                                  Suficiente
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Tab 2: Kardex / Movimientos */}
        {activeTab === 'movements' && (
          <Card className="border-primary/5 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-bold">Kardex de Auditoría</CardTitle>
              <CardDescription>
                Registro histórico detallado de ingresos y egresos de almacén.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  <Skeleton className="h-10 w-full rounded-xl" />
                  <Skeleton className="h-10 w-full rounded-xl" />
                  <Skeleton className="h-10 w-full rounded-xl" />
                </div>
              ) : filteredMovements.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <History className="h-10 w-10 text-muted-foreground/40 mb-3" />
                  <p className="text-sm font-semibold text-muted-foreground">
                    No se registraron movimientos.
                  </p>
                  <p className="text-xs text-muted-foreground/85">
                    Intente cambiando el término de búsqueda o filtros.
                  </p>
                </div>
              ) : (
                <div className="relative overflow-x-auto rounded-xl border">
                  <table className="w-full text-left text-sm text-foreground">
                    <thead className="bg-muted/70 text-xs font-bold uppercase tracking-wider text-muted-foreground border-b">
                      <tr>
                        <th className="px-6 py-3.5">Fecha</th>
                        <th className="px-6 py-3.5">Olla Común</th>
                        <th className="px-6 py-3.5">Insumo</th>
                        <th className="px-6 py-3.5 text-center">Tipo</th>
                        <th className="px-6 py-3.5 text-right">Cantidad</th>
                        <th className="px-6 py-3.5">Detalle / Origen</th>
                        <th className="px-6 py-3.5">Registrado por</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filteredMovements.map((m) => {
                        const isIngreso = m.movementType === 'in';
                        const isAdjustment = m.movementType === 'adjustment';
                        const isWaste = m.movementType === 'waste';

                        let badge = (
                          <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 dark:bg-orange-900/30 px-2.5 py-0.5 text-xs font-semibold text-orange-800 dark:text-orange-300">
                            <ArrowDownLeft className="h-3.5 w-3.5" /> Salida
                          </span>
                        );

                        if (isIngreso) {
                          badge = (
                            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 dark:bg-green-900/30 px-2.5 py-0.5 text-xs font-semibold text-green-800 dark:text-green-300">
                              <ArrowUpRight className="h-3.5 w-3.5" /> Ingreso
                            </span>
                          );
                        } else if (isAdjustment) {
                          badge = (
                            <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 dark:bg-blue-900/30 px-2.5 py-0.5 text-xs font-semibold text-blue-800 dark:text-blue-300">
                              Ajuste
                            </span>
                          );
                        } else if (isWaste) {
                          badge = (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 dark:bg-red-900/30 px-2.5 py-0.5 text-xs font-semibold text-red-800 dark:text-red-300">
                              Merma
                            </span>
                          );
                        }

                        return (
                          <tr key={m.id} className="hover:bg-muted/20 transition-colors">
                            <td className="px-6 py-4 text-xs font-medium text-muted-foreground">
                              {new Date(m.movementDate).toLocaleString('es-PE', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </td>
                            <td className="px-6 py-4 font-medium">{m.ollaName}</td>
                            <td className="px-6 py-4">{m.supplyItemName}</td>
                            <td className="px-6 py-4 text-center">{badge}</td>
                            <td className="px-6 py-4 text-right font-bold">
                              {m.quantity} {m.unit}
                            </td>
                            <td className="px-6 py-4 text-xs">
                              {m.notes ? (
                                <span className="text-foreground/80">{m.notes}</span>
                              ) : (
                                <span className="text-muted-foreground/60 italic">—</span>
                              )}
                              {m.sourceName && (
                                <div className="text-[10px] text-muted-foreground font-semibold">
                                  Origen: {m.sourceName}
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 text-xs font-medium text-muted-foreground">
                              {m.createdByName}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </PageShell>
  );
}
