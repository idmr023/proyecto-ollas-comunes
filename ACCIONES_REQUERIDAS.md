# Acciones requeridas — Remediación de auditoría

**Fecha:** 19 de julio de 2026
**Contexto:** `[CAMBIOS_AUDITORIA.md](./CAMBIOS_AUDITORIA.md)` · `[DIAGNOSTICO_AUDITORIA.md](./DIAGNOSTICO_AUDITORIA.md)`

Lista de lo que **no puede resolverse desde el código** y requiere una decisión o una
acción sobre infraestructura, datos o el repositorio.

Ordenado por consecuencia si se hace mal. **Los puntos 1 a 3 bloquean el despliegue.**

Estado del árbol de trabajo: **37 archivos modificados, 15 nuevos, 113 desindexados.
Nada commiteado.**

---

## 🔴 Bloqueantes

### 1. Fijar `DB_ENCRYPTION_KEY` antes de rotar `JWT_SECRET`

> [!CAUTION]
> **El orden importa y el error es irreversible.** Los DNI y secretos TOTP existentes
> están cifrados con `sha256(JWT_SECRET)`. Rotar la firma antes de fijar esta variable
> los deja ilegibles de forma permanente.

- [ ] Obtener el valor derivado del secreto **actual**:
  ```bash
  node -e "console.log(require('crypto').createHash('sha256').update(process.env.JWT_SECRET).digest('hex'))"
  ```

- [ ] Definir `DB_ENCRYPTION_KEY` con ese valor en Render.
- [ ] **Solo entonces** continuar con el punto 2.

- [ ] **Comprobar la longitud de** `JWT_SECRET`**.** Ahora se exigen ≥32 caracteres: si el
  ```
  actual es más corto, **la aplicación no arranca**. Verificarlo antes de desplegar.
  ```



### 2. Rotar credenciales

- [ ] `SUPABASE_SECRET_KEY`
- [ ] `DATABASE_URL`
- [ ] `JWT_SECRET`  ← solo después del punto 1
- [ ] `SMTP_PASS`
- [ ] `GOOGLE_CLIENT_SECRET`
- [ ] `GEMINI_API_KEY`

**Matiz sobre la urgencia:** se verificó con `git cat-file -e` que los commits
pre-reescritura **ya no existen en el almacén local** y que `refs/original` está vacío.
El diagnóstico deducía lo contrario a partir del tamaño del `.git`. El riesgo real es
que el mapa commiteado llegó al remoto, donde los objetos sí pueden persistir. La
rotación es seguro barato, no emergencia confirmada — pero conviene hacerla igual.

### 3. `ALLOWED_ORIGINS` en Render

- [ ] Incluir el dominio de Vercel.

CORS pasó a `credentials: true` (necesario para la cookie de sesión). Un origen no
listado hace **fallar toda petición**. Es el fallo más probable del despliegue.

---



## 🟠 Requieren revisión antes de dar por cerrado



### 4. Determinar si el fallo de `getUserOlla` causó daño real

Sin acceso a los datos no puede responderse desde el código, y **el resultado cambia si
queda trabajo de reparación pendiente**.

- [ ] Ejecutar:
  ```sql
  SELECT t.name, COUNT(*) AS ollas_activas
  FROM ollas_comunes o JOIN tenants t ON t.id = o.tenant_id
  WHERE o.status = 'active'
  GROUP BY t.name HAVING COUNT(*) > 1;
  ```


| Resultado     | Interpretación                                                                                                                              | Acción                                                                                                        |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| **Sin filas** | Cada organización tenía una sola olla. El fallo estaba **latente**: nunca llegó a causar daño, pero se habría activado al crear la segunda. | Nada más.                                                                                                     |
| **Con filas** | Esas organizaciones pudieron escribir **entregas de raciones y movimientos de inventario en la olla equivocada**.                           | Auditar esos registros y decidir si se corrigen. La corrección del código **no los repara retroactivamente**. |




### 5. Aplicar la migración y asignar ollas a mano

- [ ] Aplicar `supabase/migrations/20260719120000_add_app_user_olla.sql`.
- [ ] Ejecutar la consulta de revisión incluida al final de la migración.
- [ ] Asignar olla a las lideresas que aparezcan en ella.

El backfill solo asigna automáticamente cuando la organización tiene **exactamente una**
olla activa, donde no hay ambigüedad. Con varias se deja sin asignar **a propósito**:
adivinar reproduciría el fallo que se está corrigiendo. Hasta que se asignen, el backend
les niega el acceso (*fail-closed*, deliberado).

Las altas nuevas ya no pueden quedar en ese estado: `register` exige `ollaId` cuando el
rol es `lideresa_olla`.

### 6. Probar el frontend — es la parte menos verificada

> [!WARNING]
> `proxy.ts` y el rewrite de `next.config.ts` están verificados **por tipos y contra la
> documentación de Next 16, pero nunca se han ejecutado**. No pudo hacerse aquí porque
> `recharts` y `@playwright/test` están declarados en `package.json` pero no instalados.

- [ ] `cd frontend && npm install && npm run build`
- [ ] Ciclo completo a mano: login → OTP → workspace → **recarga de página** → logout.
- [ ] **Comprobación clave:** `/workspace/home` en ventana privada debe redirigir a
  ```
  `/login` **sin llegar a renderizar** la página.
  ```
- [ ] Probar en **Safari**, no solo en Chrome: el motivo del rewrite es precisamente que
  ```
  Safari bloquea cookies de terceros por defecto.
  ```



### 7. Ejecutar las pruebas que necesitan entorno vivo

- [ ] `integration.test.ts`
- [ ] `functional.test.ts`

Cubren el control de acceso real — justo lo que más se modificó en C-1 y C-2. Las 208
pruebas unitarias sí se ejecutaron y están en verde.

---



## 🟡 Decisiones pendientes



### a) Purga del historial de git

`.git-rewrite/` está desindexado y añadido al `.gitignore`, pero **no se ejecutaron**
`reflog expire` ni `gc --prune --aggressive` por ser irreversibles.

Dado que los objetos originales ya no están en el almacén local, aportarían poco.

- [ ] Decidir si se ejecutan, con el repositorio respaldado previamente.



### b) Estrategia de commit

37 archivos modificados, 15 nuevos y 113 desindexados, sobre la rama `main`.

- [ ] Decidir: rama + PR (recomendado, por el tamaño del cambio) o commit directo.



### c) `mobile_app/` sin rastrear

Quedó fuera del alcance por indicación expresa, pero ahora mismo está en tierra de nadie.

- [ ] Decidir si entra en git o al `.gitignore`.



### d) ¿Sigue haciendo falta el soporte `Bearer`?

Se **mantuvo deliberadamente** como alternativa a la cookie, porque quitarlo rompería la
app móvil nativa y las pruebas de integración. La cookie tiene prioridad sobre la
cabecera.

**No pudo verificarse** si esa app existe o consume esta API, por estar excluida del
alcance.

- [ ] Confirmar. Si no la usa nadie, eliminar `Bearer` cerraría A-3 por completo.

---



## Variables de entorno nuevas


| Variable                | Obligatoria          | Descripción                                                                                   |
| ----------------------- | -------------------- | --------------------------------------------------------------------------------------------- |
| `DB_ENCRYPTION_KEY`     | **Sí en producción** | Clave de cifrado en reposo, independiente de `JWT_SECRET`. Hex de 64 caracteres. Ver punto 1. |
| `EXPOSE_ERROR_DETAILS`  | No                   | `true` expone detalles de error en las respuestas. **Nunca en producción.**                   |
| `RATE_LIMIT_GLOBAL_MAX` | No                   | Peticiones por minuto globales. Por defecto 300 en producción.                                |
| `JSON_BODY_LIMIT`       | No                   | Tamaño máximo del cuerpo. Por defecto `10mb`.                                                 |
| `BACKEND_ORIGIN`        | No                   | Destino del rewrite del frontend. Si falta se usa `NEXT_PUBLIC_API_URL`.                      |


`JWT_SECRET` ya no admite valores de menos de 32 caracteres: **la aplicación no arranca**.

---



## Trabajo pendiente que no requiere intervención

Puede abordarse sin decisiones previas:


| Prioridad | Tarea                                                      | Nota                                                                                                                                                                                                                                                        |
| --------- | ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Alta**  | **A-1 — RLS inefectivo**                                   | Lo más importante que queda. Cero referencias a `current_tenant_id`: las 20 políticas no se activan nunca. Establecerlo en la transacción es contenido; **conectar Prisma con un rol no propietario toca credenciales de BD y sí necesitaría visto bueno**. |
| Alta      | CI con Postgres                                            | Sin él, integración y funcionales solo corren a mano. Mejor relación esfuerzo/beneficio pendiente.                                                                                                                                                          |
| Media     | Conteos globales en el dashboard                           | Fuga cross-tenant. Dos líneas.                                                                                                                                                                                                                              |
| Media     | M-6 · validar TLS contra la CA de Supabase                 |                                                                                                                                                                                                                                                             |
| Media     | M-8 · slug como columna indexada                           | Las rutas críticas ya usan `findById`.                                                                                                                                                                                                                      |
| Media     | M-1 · índice ciego para el DNI                             | **Requiere migración de datos.** Hacerlo *después* de fijar `DB_ENCRYPTION_KEY` o se recifra dos veces.                                                                                                                                                     |
| Baja      | A-4 · nonce en la CSP · unificar `handleError` · B-1 a B-5 |                                                                                                                                                                                                                                                             |


---



## Orden sugerido

1. **Punto 4 primero.** Si devuelve filas, cambia la prioridad de todo lo demás: habría
  datos que reparar antes de seguir.
2. Puntos 1 a 3 (variables de entorno y credenciales).
3. Puntos 5 a 7 (migración, frontend, pruebas).
4. Decisiones a–d.
5. A-1 y el resto del trabajo pendiente.

