import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageShell } from '@/components/workspace/page-shell';

export default function ReportesPage() {
  return (
    <PageShell
      title="Reportes"
      description="Indicadores, consumo y trazabilidad."
      width="wide"
    >
      <Card className="border-primary/10 shadow-sm">
        <CardHeader>
          <CardTitle>Base lista</CardTitle>
          <CardDescription>El diseño ya contempla gráficas y reportes operativos.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-6 text-muted-foreground">Pendiente de conectar consultas agregadas.</p>
        </CardContent>
      </Card>
    </PageShell>
  );
}
