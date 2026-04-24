import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageShell } from '@/components/workspace/page-shell';

export default function BeneficiariosPage() {
  return (
    <PageShell
      title="Beneficiarios"
      description="Padrón y seguimiento de beneficiarios."
      width="wide"
    >
      <Card className="border-primary/10 shadow-sm">
        <CardHeader>
          <CardTitle>Próximo paso</CardTitle>
          <CardDescription>Lista por organización y olla común.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-6 text-muted-foreground">Pendiente de conectar al módulo real.</p>
        </CardContent>
      </Card>
    </PageShell>
  );
}
