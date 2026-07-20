# Acciones requeridas — Remediación de auditoría

**Fecha:** 19 de julio de 2026
**Contexto:** [`CAMBIOS_AUDITORIA.md`](./CAMBIOS_AUDITORIA.md) · [`DIAGNOSTICO_AUDITORIA.md`](./DIAGNOSTICO_AUDITORIA.md)

Lista de lo que **no puede resolverse desde el código** y requiere una decisión o una
acción sobre infraestructura, datos o el repositorio.

Ordenado por consecuencia si se hace mal. **Los puntos 1 a 3 bloquean el despliegue.**

---

## 0. Estado del repositorio

El trabajo **ya está commiteado y subido**. Punto de partida: la versión de `main` al
inicio del día.


| Rama                      | Contenido                                                                                                                                     |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `main`                    | Versión del inicio del día **+ la remediación de seguridad**                                                                                  |
| `Aaron`                   | Todo lo de `main` + el trabajo propio de la rama (jobs de IA, calculadora de preparación, migraciones 003–007). **Para revisión del equipo.** |
| `wip/auditoria-seguridad` | Rama intermedia con los dos commits de remediación. Puede borrarse una vez revisado.                                                          |


Commits de la remediación:

```
chore: elimina .git-rewrite del control de versiones
fix(seguridad): remediacion de auditoria - criticos, RBAC y sesion en cookie
merge: reconcilia Aaron con main incorporando la remediacion   (solo en Aaron)
chore: saca mobile_app/ del control de versiones               (solo en Aaron)
```

**Verificación:** typecheck limpio en backend y frontend · pruebas unitarias en verde:
**208 en `main`** y **215 en `Aaron`**, que suma las suyas de `preparacion` y
`pronostico`. Sin ejecutar: integración, funcionales y `next build` (ver puntos 6 y 7).

> [!IMPORTANT]
> **`main` y `Aaron` no compartían ancestro común.** Es secuela del `git filter-branch`
> que reescribió el historial de `main` (hallazgo C-5): sus objetos son todos nuevos y la
> parentela con las ramas de trabajo se rompió.
>
> La fusión de hoy lo resuelve **solo para `Aaron`**. Las demás ramas —`Francesco`,
> `Ivan`, `Nelson`, `Sebastian`, `development`— siguen igual y necesitarán el mismo
> tratamiento: `git merge main --allow-unrelated-histories -X theirs`, más la
> reconciliación manual de lo que cada una haya tocado.

### Acciones de repositorio pendientes

- [ ] **Revisar el trabajo en `Aaron`** — es el objetivo de la subida. `main` ya tiene la
      remediación, así que cualquiera que despliegue desde ahí despliega el código
      corregido.
- [ ] **Borrar `wip/auditoria-seguridad`** una vez revisado. Era rama intermedia; su
      contenido está en `main` y en `Aaron`.
- [ ] **Al fusionar `Aaron` hacia `main`,** esperar un conflicto en este mismo archivo.

  `main` **no está contenida en `Aaron`**: el commit de documentación llegó a cada rama
  por un camino distinto (subida directa en `main`, `cherry-pick` en `Aaron`), así que
  tienen identificadores diferentes aunque **el contenido sea idéntico**. Git lo verá
  tocado por ambos lados; se resuelve tomando cualquiera de las dos versiones.

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
- [ ] **Comprobar la longitud de `JWT_SECRET`.** Ahora se exigen ≥32 caracteres: si el
      actual es más corto, **la aplicación no arranca**. Verificarlo antes de desplegar,
      no después.

### 2. Rotar credenciales

- [ ] `SUPABASE_SECRET_KEY`
- [ ] `DATABASE_URL`
- [ ] `JWT_SECRET` ← solo después del punto 1
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


| Resultado     | Interpretación                                                                                                                     | Acción                                                                                                        |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| **Sin filas** | Cada organización tenía una sola olla. El fallo estaba **latente**: nunca causó daño, pero se habría activado al crear la segunda. | Nada más.                                                                                                     |
| **Con filas** | Esas organizaciones pudieron escribir **entregas de raciones y movimientos de inventario en la olla equivocada**.                  | Auditar esos registros y decidir si se corrigen. La corrección del código **no los repara retroactivamente**. |


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

> [!WARNING]
> **Las migraciones conviven ahora en dos sistemas.** `backend/prisma/migrations/`
> (003–007, procedentes de `Aaron`) y `supabase/migrations/` (las de `main`, incluida la
> de `olla_id`). Conviene unificarlo antes de que alguien aplique solo la mitad.

### 6. Probar el frontend — es la parte menos verificada

> [!WARNING]
> `proxy.ts` y el rewrite de `next.config.ts` están verificados **por tipos y contra la
> documentación de Next 16, pero nunca se han ejecutado**. No pudo hacerse porque
> `recharts` y `@playwright/test` están declarados en `package.json` pero no instalados.

- [ ] `cd frontend && npm install && npm run build`
- [ ] Ciclo completo a mano: login → OTP → workspace → **recarga de página** → logout.
- [ ] **Comprobación clave:** `/workspace/home` en ventana privada debe redirigir a
      `/login` **sin llegar a renderizar** la página.
- [ ] Probar en **Safari**, no solo en Chrome: el motivo del rewrite es precisamente que
      Safari bloquea cookies de terceros por defecto.

### 7. Ejecutar las pruebas que necesitan entorno vivo

- [ ] `integration.test.ts`
- [ ] `functional.test.ts`

Cubren el control de acceso real — justo lo que más se modificó en C-1 y C-2. Las
pruebas unitarias sí se ejecutaron y están en verde.

### 8. Avisar al equipo móvil: se retiró el modo de depuración

`Aaron` tenía en `auth/service.ts` un modo de depuración con `DEBUG_AUTH_ENABLED`, un OTP
fijo `'000000'` y un usuario en memoria. Al prevalecer la versión de `main` en la fusión,
**ese código ya no está en la rama**.

- [ ] Confirmar si alguien lo usaba para probar la app móvil y acordar un sustituto.

No se reintrodujo a propósito: un OTP fijo y un usuario en memoria son lo contrario de
una remediación de seguridad, aunque estuvieran limitados a entornos no productivos.

---

## 🟡 Decisiones pendientes

### a) Purga del historial de git

`.git-rewrite/` está desindexado y en el `.gitignore`, pero **no se ejecutaron**
`reflog expire` ni `gc --prune --aggressive` por ser irreversibles. Dado que los objetos
originales ya no están en el almacén local, aportarían poco.

- [ ] Decidir si se ejecutan, con el repositorio respaldado previamente.

### b) ¿Sigue haciendo falta el soporte `Bearer`?

Se **mantuvo deliberadamente** como alternativa a la cookie, porque quitarlo rompería la
app móvil nativa y las pruebas de integración. La cookie tiene prioridad sobre la
cabecera.

- [ ] Confirmar. Si no la usa nadie, eliminar `Bearer` cerraría A-3 por completo.

### Decisiones ya tomadas


| Decisión             | Resolución                                                                                                                                                                                            |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Estrategia de commit | Dos commits sobre `main`; `Aaron` los recibe por fusión, para revisión del equipo.                                                                                                                    |
| `mobile_app/`        | **La app Flutter no fue aprobada.** Desindexada y añadida al `.gitignore`. Los archivos siguen en disco y los commits de las fases 0–2 permanecen en el historial: recuperarla es revertir un commit. |


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


| Prioridad | Tarea                                                      | Nota                                                                                                                                                                                                                                                        |
| --------- | ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Alta**  | **A-1 — RLS inefectivo**                                   | Lo más importante que queda. Cero referencias a `current_tenant_id`: las 20 políticas no se activan nunca. Establecerlo en la transacción es contenido; **conectar Prisma con un rol no propietario toca credenciales de BD y sí necesitaría visto bueno**. |
| Alta      | CI con Postgres                                            | Sin él, integración y funcionales solo corren a mano. Mejor relación esfuerzo/beneficio pendiente.                                                                                                                                                          |
| Media     | Conteos globales en el dashboard                           | Fuga cross-tenant en `getAdminDashboard`. Dos líneas.                                                                                                                                                                                                       |
| Media     | M-6 · validar TLS contra la CA de Supabase                 |                                                                                                                                                                                                                                                             |
| Media     | M-8 · slug como columna indexada                           | Las rutas críticas ya usan `findById`.                                                                                                                                                                                                                      |
| Media     | M-1 · índice ciego para el DNI                             | **Requiere migración de datos.** Hacerlo *después* de fijar `DB_ENCRYPTION_KEY`, o se recifra dos veces.                                                                                                                                                    |
| Baja      | A-4 · nonce en la CSP · unificar `handleError` · B-1 a B-5 |                                                                                                                                                                                                                                                             |


---

## Orden sugerido

1. **Punto 4 primero.** Si devuelve filas, cambia la prioridad de todo lo demás: habría
  datos que reparar antes de seguir.
2. Puntos 1 a 3 (variables de entorno y credenciales).
3. Puntos 5 a 8 (migración, frontend, pruebas, aviso al equipo móvil).
4. Decisiones a–b.
5. A-1 y el resto del trabajo pendiente.

