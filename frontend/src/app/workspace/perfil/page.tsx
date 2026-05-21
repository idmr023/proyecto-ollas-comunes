'use client';

import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageShell } from '@/components/workspace/page-shell';
import { useAuthStore } from '@/store/auth-store';

const fallbackUser = {
  fullName: 'OC Usuario',
  email: 'usuario@ollascomunes.pe',
  role: 'admin_municipal',
  tenantId: '',
  tenantName: '',
};

export default function PerfilPage() {
  const { user } = useAuthStore();
  const currentUser = useMemo(() => user ?? { id: '', ...fallbackUser }, [user]);

  const [fullName, setFullName] = useState(currentUser.fullName);
  const [email, setEmail] = useState(currentUser.email);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  };

  return (
    <PageShell title="Mi perfil" width="form">

      <Card className="border-primary/10 shadow-sm">
        <CardHeader>
          <CardTitle>Usuario</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="profile-name">Nombre</Label>
            <Input id="profile-name" value={fullName} onChange={(event) => setFullName(event.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="profile-email">Correo</Label>
            <Input id="profile-email" value={email} onChange={(event) => setEmail(event.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label>Tenant</Label>
            <p className="text-sm text-muted-foreground">{currentUser.tenantName}</p>
          </div>
          <div className="grid gap-2">
            <Label>Rol</Label>
            <p className="text-sm text-muted-foreground capitalize">{currentUser.role.replace('_', ' ')}</p>
          </div>
        </CardContent>
        <div className="flex items-center justify-end border-t bg-muted/40 px-4 py-4">
          <Button onClick={handleSave}>Guardar cambios</Button>
        </div>
      </Card>

      {saved ? (
        <p className="text-sm font-medium text-primary">Datos actualizados correctamente.</p>
      ) : null}
    </PageShell>
  );
}
