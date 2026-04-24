import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageShell } from '@/components/workspace/page-shell';

export default function InventarioPage() {
  return (
    <PageShell
      title="Inventario"
      description="Ingresos, salidas y stock de insumos."
      width="wide"
    >
      <Card className="border-primary/10 shadow-sm">
        <CardHeader>
          <CardTitle>Estado actual</CardTitle>
          <CardDescription>La base ya contempla insumos, fuentes y movimientos.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-6 text-muted-foreground">Pendiente de conectar el flujo operativo.</p>
        </CardContent>
      </Card>
    </PageShell>
  );
}
