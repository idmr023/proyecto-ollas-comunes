'use client';

import { useMemo, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageShell } from '@/components/workspace/page-shell';
import { useAuthStore } from '@/store/auth-store';
import { updateProfileRequest } from '@/lib/auth-api';
import { toast } from 'sonner';

const fallbackUser = {
  fullName: 'OC Usuario',
  email: 'usuario@ollascomunes.pe',
  role: 'admin_municipal',
  tenantId: '',
  tenantName: '',
};

export default function PerfilPage() {
  const { user, setAuth } = useAuthStore();
  const currentUser = useMemo(() => user ?? { id: '', ...fallbackUser }, [user]);

  const [fullName, setFullName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Sincronizar el estado del formulario con el usuario actual cuando cargue
  useEffect(() => {
    if (currentUser.fullName) {
      setFullName(currentUser.fullName);
    }
  }, [currentUser.fullName]);

  const handleSave = async () => {
    if (!fullName.trim()) {
      toast.error('El nombre no puede estar vacío.');
      return;
    }

    const payload: { fullName?: string; currentPassword?: string; newPassword?: string } = {
      fullName: fullName.trim(),
    };

    if (newPassword || confirmPassword || currentPassword) {
      if (!currentPassword) {
        toast.error('Por favor ingresa tu contraseña actual para realizar cambios de seguridad.');
        return;
      }
      if (newPassword.length < 6) {
        toast.error('La nueva contraseña debe tener al menos 6 caracteres.');
        return;
      }
      if (newPassword !== confirmPassword) {
        toast.error('La nueva contraseña y su confirmación no coinciden.');
        return;
      }
      payload.currentPassword = currentPassword;
      payload.newPassword = newPassword;
    }

    setSubmitting(true);
    try {
      const res = await updateProfileRequest(payload);
      if (res.ok && res.user) {
        // El backend reemite la cookie de sesión en esta misma respuesta.
        setAuth(res.user);
        toast.success('Perfil actualizado correctamente.');
        
        // Limpiar campos de contraseña
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        toast.error(res.message ?? 'No se pudo actualizar el perfil.');
      }
    } catch (err) {
      toast.error('Ocurrió un error al intentar guardar los cambios.');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
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
            <Input 
              id="profile-name" 
              value={fullName} 
              onChange={(event) => setFullName(event.target.value)} 
              disabled={submitting}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="profile-email">Correo (Solo lectura)</Label>
            <Input 
              id="profile-email" 
              value={currentUser.email} 
              disabled 
              className="bg-muted text-muted-foreground/80 cursor-not-allowed"
            />
          </div>
          <div className="grid gap-2">
            <Label>Tenant / Organización</Label>
            <p className="text-sm text-muted-foreground font-semibold">{currentUser.tenantName || 'No asignada'}</p>
          </div>
          <div className="grid gap-2 font-semibold">
            <Label>Rol</Label>
            <p className="text-sm text-muted-foreground capitalize">{currentUser.role.replace('_', ' ')}</p>
          </div>
          
          <hr className="my-2 border-border" />
          
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-foreground">Cambiar Contraseña (Opcional)</h3>
            <div className="grid gap-2">
              <Label htmlFor="current-password">Contraseña Actual</Label>
              <Input 
                id="current-password" 
                type="password" 
                value={currentPassword} 
                onChange={(event) => setCurrentPassword(event.target.value)} 
                disabled={submitting}
                placeholder="Ingresa tu contraseña actual"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-password">Nueva Contraseña</Label>
              <Input 
                id="new-password" 
                type="password" 
                value={newPassword} 
                onChange={(event) => setNewPassword(event.target.value)} 
                disabled={submitting}
                placeholder="Mínimo 6 caracteres"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirm-password">Confirmar Nueva Contraseña</Label>
              <Input 
                id="confirm-password" 
                type="password" 
                value={confirmPassword} 
                onChange={(event) => setConfirmPassword(event.target.value)} 
                disabled={submitting}
                placeholder="Repite tu nueva contraseña"
              />
            </div>
          </div>
        </CardContent>
        <div className="flex items-center justify-end border-t bg-muted/40 px-4 py-4">
          <Button onClick={handleSave} disabled={submitting}>
            {submitting ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </div>
      </Card>
    </PageShell>
  );
}
