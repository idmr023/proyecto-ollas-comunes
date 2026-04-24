import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ReportesPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold font-heading text-foreground">Reportes</h1>
        <p className="text-sm text-muted-foreground">
          Espacio preparado para indicadores, consumo, cobertura y trazabilidad.
        </p>
      </div>

      <Card className="border-primary/10 shadow-sm">
        <CardHeader>
          <CardTitle>Base lista</CardTitle>
          <CardDescription>
            El diseño ya contempla gráficas y reportes operativos, pero aún faltan consultas agregadas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-6 text-muted-foreground">
            Una siguiente iteración puede traer métricas por tenant, por olla común y por fechas.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
