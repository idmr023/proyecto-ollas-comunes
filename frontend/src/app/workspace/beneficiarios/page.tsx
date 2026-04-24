import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function BeneficiariosPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold font-heading text-foreground">Beneficiarios</h1>
        <p className="text-sm text-muted-foreground">
          Este módulo queda listo para conectar padrón, perfiles y condiciones de salud.
        </p>
      </div>

      <Card className="border-primary/10 shadow-sm">
        <CardHeader>
          <CardTitle>Próximo paso</CardTitle>
          <CardDescription>
            Aquí podremos listar beneficiarios por tenant y olla común cuando el backend exponga ese módulo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-6 text-muted-foreground">
            Por ahora es una vista de referencia para evitar enlaces rotos mientras construimos el flujo real.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
