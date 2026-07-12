# Credenciales de depuracion movil

Estas credenciales existen solo para desarrollo local si el backend tiene:

```env
NODE_ENV=development
DEBUG_AUTH_ENABLED=true
```

Credenciales:

```text
Correo: debug.mobile@sigo.local
Password: DebugMobile123!
OTP: 000000
```

El backend no crea un usuario ficticio con estas credenciales. En su lugar,
asocia la sesion a un usuario real activo de la base de datos para que el movil
use tenant, olla, inventario y padron reales.

Si quieres fijar que usuario real se usa, configura:

```env
DEBUG_AUTH_USER_EMAIL=usuario.real@dominio.pe
```

Si la base de datos no esta accesible y solo necesitas validar login/OTP en el
movil, puedes activar un usuario en memoria:

```env
DEBUG_AUTH_ALLOW_MEMORY_USER=true
```

Usuario en memoria emitido en el JWT:

```text
Nombre: Usuario Debug Movil
Email real del token: debug.user@sigo.local
Rol: lideresa_olla
Tenant: Olla Debug
```

Guardas de seguridad:

- No funciona con `NODE_ENV=production`.
- No funciona si `DEBUG_AUTH_ENABLED` no es exactamente `true`.
- El token temporal dev solo acepta el OTP configurado en `DEBUG_AUTH_OTP`.
- El usuario en memoria solo existe si `DEBUG_AUTH_ALLOW_MEMORY_USER=true`.

## Estado de validacion local

El backend compila con este flujo (`npm run build`). Si Prisma no logra acceder
a la base de datos configurada y devuelve `EACCES`, activa
`DEBUG_AUTH_ALLOW_MEMORY_USER=true` para validar el login movil sin BD.

Validado en emulador Android el 2026-07-09:

- Backend local en `http://localhost:4000`.
- App debug apuntando a `http://10.0.2.2:4000`.
- Login con `debug.mobile@sigo.local`.
- OTP `000000`.
- Resultado: dashboard abierto correctamente con usuario debug.

Flujo esperado:

1. `POST /api/auth/login` con correo/password debug.
2. Respuesta `MFA_PENDING` con `tempToken` y `devOtp`.
3. `POST /api/auth/verify-otp` con el `tempToken` y OTP `000000`.
4. Respuesta con JWT asociado al usuario activo configurado, o al usuario en
   memoria si `DEBUG_AUTH_ALLOW_MEMORY_USER=true`.
