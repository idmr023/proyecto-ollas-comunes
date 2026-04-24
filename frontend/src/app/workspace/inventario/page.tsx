import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function InventarioPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold font-heading text-foreground">Inventario</h1>
        <p className="text-sm text-muted-foreground">
          Vista mínima para preparar ingresos, salidas y stock de insumos por olla común.
        </p>
      </div>

      <Card className="border-primary/10 shadow-sm">
        <CardHeader>
          <CardTitle>Estado actual</CardTitle>
          <CardDescription>
            La base ya tiene tablas para insumos, fuentes y movimientos; falta conectar el módulo real.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-6 text-muted-foreground">
            Este placeholder mantiene la navegación completa mientras avanzamos en el CRUD operativo.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
