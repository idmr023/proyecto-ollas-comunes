'use client';

import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/store/auth-store';

const fallbackUser = {
  name: 'OC Usuario',
  email: 'usuario@ollascomunes.pe',
  username: 'oc-usuario',
};

export default function PerfilPage() {
  const { user, updateUser } = useAuthStore();
  const currentUser = useMemo(() => user ?? { id: 'demo-user', ...fallbackUser }, [user]);

  const [name, setName] = useState(currentUser.name);
  const [email, setEmail] = useState(currentUser.email);
  const [username, setUsername] = useState(currentUser.username);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    updateUser({ name, email, username });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold font-heading text-foreground">Mi perfil</h1>

      <Card className="border-primary/10 shadow-sm">
        <CardHeader>
          <CardTitle>Usuario</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="profile-name">Nombre</Label>
            <Input id="profile-name" value={name} onChange={(event) => setName(event.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="profile-email">Correo</Label>
            <Input id="profile-email" value={email} onChange={(event) => setEmail(event.target.value)} />
          </div>
          <div className="grid gap-2 md:col-span-2">
            <Label htmlFor="profile-username">Usuario</Label>
            <Input id="profile-username" value={username} onChange={(event) => setUsername(event.target.value)} />
          </div>
        </CardContent>
        <div className="flex items-center justify-end border-t bg-muted/40 px-4 py-4">
          <Button onClick={handleSave}>Guardar cambios</Button>
        </div>
      </Card>

      {saved ? (
        <p className="text-sm font-medium text-primary">Datos demo actualizados correctamente.</p>
      ) : null}
    </div>
  );
}
