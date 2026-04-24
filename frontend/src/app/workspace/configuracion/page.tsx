import Link from 'next/link';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageShell } from '@/components/workspace/page-shell';

export default function ConfiguracionPage() {
  return (
    <PageShell
      title="Configuración"
      description="Accesos rápidos de cuenta y apariencia."
      width="wide"
    >
      <Card className="border-primary/10 shadow-sm">
        <CardHeader>
          <CardTitle>Preferencias disponibles</CardTitle>
          <CardDescription>Perfil y apariencia en una sola vista.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/workspace/preferencias">Abrir preferencias</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/workspace/perfil">Abrir perfil</Link>
          </Button>
        </CardContent>
      </Card>
    </PageShell>
  );
}
