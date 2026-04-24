import Link from 'next/link';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function ConfiguracionPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold font-heading text-foreground">Configuración</h1>
        <p className="text-sm text-muted-foreground">
          Accesos rápidos para personalizar la experiencia actual del panel.
        </p>
      </div>

      <Card className="border-primary/10 shadow-sm">
        <CardHeader>
          <CardTitle>Preferencias disponibles</CardTitle>
          <CardDescription>
            Ajusta el tema visual o revisa el perfil demo desde los módulos mínimos ya disponibles.
          </CardDescription>
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
    </div>
  );
}
