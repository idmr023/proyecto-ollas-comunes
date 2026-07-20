# Mapeo de Historias de Usuario (HU) y Escenarios E2E (Playwright)

Este documento detalla las **Historias de Usuario (HU)** del sistema **SIGO-OLLAS**, estructuradas bajo el formato ágil estándar (*Como / Quiero / Para*) y correlacionadas directamente con los escenarios de pruebas automatizadas de extremo a extremo (E2E) implementados en Playwright.

---

## 🔒 1. Módulo de Autenticación y Acceso Seguro

### HU-01: Autenticación con Segundo Factor (MFA/TOTP)
*   **Fórmula:**
    *   **Como:** Usuario del sistema (Lideresa o Administrador Municipal).
    *   **Quiero:** Iniciar sesión con mi correo, contraseña y un código TOTP dinámico de 6 dígitos.
    *   **Para:** Garantizar la confidencialidad de los datos de la olla común y el padrón de beneficiarios.
*   **Criterios de Aceptación:**
    1. Si las credenciales de correo/contraseña son incorrectas, el sistema debe denegar el acceso.
    2. Si las credenciales son correctas, el sistema debe requerir un código TOTP. Si el código OTP ingresado es inválido, se debe denegar el acceso y advertir al usuario.
    3. Si el código OTP ingresado es válido, se debe redirigir al panel correspondiente según el rol.
*   **Pruebas Playwright Asociadas:**
    *   [E-01.1](file:///d:/proyecto-ollas-comunes/frontend/e2e/mobile.spec.ts#L43): Test 01.1: Login con credenciales inválidas (Falla).
    *   [E-01.2](file:///d:/proyecto-ollas-comunes/frontend/e2e/mobile.spec.ts#L55): Test 01.2: MFA con código TOTP inválido (Falla).
    *   [E-01.3](file:///d:/proyecto-ollas-comunes/frontend/e2e/mobile.spec.ts#L75): Test 01.3: Login exitoso con TOTP dinámico (Éxito).
    *   [E-01.4](file:///d:/proyecto-ollas-comunes/frontend/e2e/mobile.spec.ts#L81): Test 01.4: Redirección automática de ruta móvil protegida sin autenticación (Falla).

### HU-02: Cierre de Sesión Seguro
*   **Fórmula:**
    *   **Como:** Usuario autenticado.
    *   **Quiero:** Cerrar mi sesión de forma explícita en el dispositivo.
    *   **Para:** Asegurar que ninguna persona no autorizada pueda acceder a mi panel si dejo el dispositivo desatendido.
*   **Criterios de Aceptación:**
    1. Al hacer clic en "Salir", se debe destruir el token de sesión (`localStorage`/cookies) y redirigir inmediatamente al formulario de login.
    2. Si el usuario intenta volver atrás usando las flechas de navegación del navegador, el sistema debe bloquear el acceso y forzar el login.
*   **Pruebas Playwright Asociadas:**
    *   [E-04](file:///d:/proyecto-ollas-comunes/frontend/e2e/mobile.spec.ts#L136): Test 04: Botón de Salir cierra la sesión.

---

## 📱 2. Módulo Móvil de la Lideresa (PWA)

### HU-03: Dashboard y Navegación Móvil
*   **Fórmula:**
    *   **Como:** Lideresa de Olla Común.
    *   **Quiero:** Visualizar un panel móvil intuitivo y una barra de navegación inferior funcional.
    *   **Para:** Acceder de forma rápida a las funciones clave de padrón, inventario, alertas y menú.
*   **Criterios de Aceptación:**
    1. El panel móvil debe dar la bienvenida y mostrar el nombre de la Olla Común activa.
    2. La barra de navegación debe cambiar de pantalla reactivamente al pulsar los iconos correspondientes.
*   **Pruebas Playwright Asociadas:**
    *   [E-02](file:///d:/proyecto-ollas-comunes/frontend/e2e/mobile.spec.ts#L89): Test 02: Dashboard muestra información correcta de la Olla.
    *   [E-03](file:///d:/proyecto-ollas-comunes/frontend/e2e/mobile.spec.ts#L98): Test 03: Barra de navegación inferior cambia de vista.

### HU-04: Consulta y Búsqueda en el Padrón Móvil
*   **Fórmula:**
    *   **Como:** Lideresa de Olla Común.
    *   **Quiero:** Consultar el listado completo de beneficiarios y buscar por nombre o DNI.
    *   **Para:** Verificar rápidamente la información de un beneficiario antes de brindarle raciones.
*   **Criterios de Aceptación:**
    1. Se debe cargar la lista de beneficiarios en la pantalla del padrón.
    2. Al ingresar un término de búsqueda, los resultados deben filtrarse en tiempo real. Si no hay coincidencias, se debe visualizar un estado vacío ("Sin resultados").
*   **Pruebas Playwright Asociadas:**
    *   [E-05](file:///d:/proyecto-ollas-comunes/frontend/e2e/mobile.spec.ts#L150): Test 05: Padrón de beneficiarios carga listado.
    *   [E-06](file:///d:/proyecto-ollas-comunes/frontend/e2e/mobile.spec.ts#L159): Test 06: Búsqueda de beneficiarios filtra resultados.

### HU-05: Registro de Beneficiarios desde el Celular
*   **Fórmula:**
    *   **Como:** Lideresa de Olla Común.
    *   **Quiero:** Registrar nuevos beneficiarios directamente desde el formulario móvil.
    *   **Para:** Mantener el padrón de la olla actualizado ante la llegada de nuevos comensales.
*   **Criterios de Aceptación:**
    1. Si se intenta guardar sin ingresar nombres o apellidos, el sistema debe mostrar mensajes de validación obligatorios.
    2. Al completar los campos (nombres, apellidos, DNI, fecha de nacimiento) de forma exitosa, el registro debe cerrarse, agregarse a la lista y permitir su búsqueda.
*   **Pruebas Playwright Asociadas:**
    *   [E-07.1](file:///d:/proyecto-ollas-comunes/frontend/e2e/mobile.spec.ts#L174): Test 07.1: Formulario de nuevo beneficiario valida obligatorios (Falla).
    *   [E-07.2](file:///d:/proyecto-ollas-comunes/frontend/e2e/mobile.spec.ts#L196): Test 07.2: Creación exitosa de un beneficiario (Éxito).
    *   [E-07.3](file:///d:/proyecto-ollas-comunes/frontend/e2e/mobile.spec.ts#L228): Test 07.3: Registrar beneficiario con DNI existente en el padrón móvil (Falla).

### HU-06: Gestión de Stock de Almacén Móvil
*   **Fórmula:**
    *   **Como:** Lideresa de Olla Común.
    *   **Quiero:** Visualizar el inventario físico y registrar movimientos de entrada de insumos.
    *   **Para:** Controlar el abastecimiento de insumos que ingresan por donaciones o compras.
*   **Criterios de Aceptación:**
    1. La pantalla de inventario debe renderizar la lista de insumos con su cantidad actual y unidad de medida.
    2. Se debe permitir registrar una entrada seleccionando el insumo, avanzando por el stepper e ingresando los datos (como lotes y fechas de vencimiento).
*   **Pruebas Playwright Asociadas:**
    *   [E-08](file:///d:/proyecto-ollas-comunes/frontend/e2e/mobile.spec.ts#L250): Test 08: Inventario muestra lista de stock actual.
    *   [E-09.1](file:///d:/proyecto-ollas-comunes/frontend/e2e/mobile.spec.ts#L258): Test 09.1: Registro de movimiento de ingreso (Éxito).
    *   [E-09.2](file:///d:/proyecto-ollas-comunes/frontend/e2e/mobile.spec.ts#L299): Test 09.2: Intento de avanzar en inventario con datos vacíos (Falla).

### HU-07: Planificación de Menú sugerido por IA
*   **Fórmula:**
    *   **Como:** Lideresa de Olla Común.
    *   **Quiero:** Generar sugerencias de platos y requerimientos de ingredientes interactivos procesados por inteligencia artificial.
    *   **Para:** Diseñar menús balanceados optimizados de acuerdo con la disponibilidad real de insumos en el almacén.
*   **Criterios de Aceptación:**
    1. La vista debe habilitar un botón de "Nueva sugerencia" para gatillar la consulta IA.
    2. Se deben calcular las raciones y mostrar de manera gráfica la lista de ingredientes recomendados.
*   **Pruebas Playwright Asociadas:**
    *   [E-10](file:///d:/proyecto-ollas-comunes/frontend/e2e/mobile.spec.ts#L316): Test 10: Menú IA muestra panel de sugerencias.
    *   [E-11](file:///d:/proyecto-ollas-comunes/frontend/e2e/mobile.spec.ts#L324): Test 11: Solicitar sugerencia de Menú IA.

### HU-08: Entrega de Raciones Alimentarias
*   **Fórmula:**
    *   **Como:** Lideresa de Olla Común.
    *   **Quiero:** Registrar el despacho de raciones a los beneficiarios de forma masiva.
    *   **Para:** Llevar un control estadístico exacto de raciones entregadas por día en la olla.
*   **Criterios de Aceptación:**
    1. Al pulsar "Registrar Entrega de Ración", debe desplegarse el panel interactivo de despacho diario.
*   **Pruebas Playwright Asociadas:**
    *   [E-12](file:///d:/proyecto-ollas-comunes/frontend/e2e/mobile.spec.ts#L351): Test 12: Registro de entrega de raciones.

---

## 💻 3. Módulo Web Administrativo (Workspace)

### HU-09: Dashboard de Gestión y Monitoreo Municipal
*   **Fórmula:**
    *   **Como:** Administrador Municipal.
    *   **Quiero:** Visualizar KPIs globales consolidando organizaciones, beneficiarios, ollas comunes e insumos críticos, acompañados de gráficos de evolución.
    *   **Para:** Tomar decisiones oportunas de abastecimiento e inclusión social basadas en datos reales.
*   **Criterios de Aceptación:**
    1. Se deben mostrar tarjetas KPIs de conteos dinámicos.
    2. Deben cargarse las secciones dinámicas de "Insumos críticos y bajo stock" y "Actividades recientes" desde la base de datos.
*   **Pruebas Playwright Asociadas:**
    *   [E-13](file:///d:/proyecto-ollas-comunes/frontend/e2e/workspace.spec.ts#L51): Test 13: Dashboard carga correctamente con KPIs y gráficos.

### HU-10: Navegación del Workspace
*   **Fórmula:**
    *   **Como:** Administrador Municipal.
    *   **Quiero:** Navegar fluidamente a través del menú lateral del sistema sin retrasos ni enlaces duplicados.
    *   **Para:** Gestionar de forma ágil las diferentes áreas administrativas de la municipalidad.
*   **Criterios de Aceptación:**
    1. Al pulsar sobre "Beneficiarios", "Organizaciones" y "Configuración", se debe redirigir al usuario al URL correspondiente sin marcar doble estado activo.
*   **Pruebas Playwright Asociadas:**
    *   [E-14.1](file:///d:/proyecto-ollas-comunes/frontend/e2e/workspace.spec.ts#L67): Test 14.1: Navegación del Sidebar (Éxito).
    *   [E-14.2](file:///d:/proyecto-ollas-comunes/frontend/e2e/workspace.spec.ts#L93): Test 14.2: Redirección de ruta de workspace protegida sin autenticación (Falla).

### HU-11: Administración del Padrón y Filtros Avanzados
*   **Fórmula:**
    *   **Como:** Administrador Municipal.
    *   **Quiero:** Visualizar el padrón consolidado, buscar por DNI/nombre y filtrar por Olla Común.
    *   **Para:** Auditar el padrón completo de la jurisdicción municipal e identificar beneficiarios específicos.
*   **Criterios de Aceptación:**
    1. Debe renderizarse la tabla responsiva con paginación y opciones de acción.
    2. Al filtrar por una Olla Común del combo selector, la tabla debe actualizarse automáticamente.
*   **Pruebas Playwright Asociadas:**
    *   [E-15](file:///d:/proyecto-ollas-comunes/frontend/e2e/workspace.spec.ts#L101): Test 15: Listado de Beneficiarios.
    *   [E-16](file:///d:/proyecto-ollas-comunes/frontend/e2e/workspace.spec.ts#L111): Test 16: Búsqueda de Beneficiarios.
    *   [E-17](file:///d:/proyecto-ollas-comunes/frontend/e2e/workspace.spec.ts#L125): Test 17: Filtro de Beneficiarios por Olla Común.

### HU-12: Mantenimiento de Beneficiarios (CRUD)
*   **Fórmula:**
    *   **Como:** Administrador Municipal.
    *   **Quiero:** Registrar, editar y dar de baja a beneficiarios del padrón municipal.
    *   **Para:** Garantizar la consistencia de los datos del padrón e incluir o remover beneficiarios según auditorías socioeconómicas.
*   **Criterios de Aceptación:**
    1. Si se intenta registrar vacío, el sistema debe desplegar alertas de inputs obligatorios.
    2. Al crear, se debe validar en base de datos la no existencia del DNI y persistir el registro de forma exitosa.
    3. Al editar, se debe poder modificar cualquier campo del beneficiario y reflejar el cambio en la tabla.
    4. Al eliminar, el registro seleccionado debe removerse de la base de datos tras confirmarse la acción.
*   **Pruebas Playwright Asociadas:**
    *   [E-18.1](file:///d:/proyecto-ollas-comunes/frontend/e2e/workspace.spec.ts#L140): Test 18.1: Formulario de Beneficiario - Validación (Falla).
    *   [E-18.2](file:///d:/proyecto-ollas-comunes/frontend/e2e/workspace.spec.ts#L158): Test 18.2: Registro Exitoso de Beneficiario (Éxito).
    *   [E-18.3](file:///d:/proyecto-ollas-comunes/frontend/e2e/workspace.spec.ts#L184): Test 18.3: Registrar beneficiario con formato de DNI inválido (letras) (Falla).
    *   [E-19](file:///d:/proyecto-ollas-comunes/frontend/e2e/workspace.spec.ts#L206): Test 19: Edición de Beneficiario.
    *   [E-20](file:///d:/proyecto-ollas-comunes/frontend/e2e/workspace.spec.ts#L232): Test 20: Eliminación de Beneficiario.

### HU-13: Administración de Organizaciones (Multi-tenant)
*   **Fórmula:**
    *   **Como:** Administrador de la Plataforma.
    *   **Quiero:** Crear y listar organizaciones (tenants) correspondientes a diferentes municipalidades.
    *   **Para:** Mantener el aislamiento absoluto de los datos por municipalidad en una sola base de datos multi-tenant.
*   **Criterios de Aceptación:**
    1. La interfaz de organizaciones debe listar los tenants del sistema.
    2. Al crear una organización con nombre y ubicación, se debe generar un slug único y habilitar su perfil de inmediato.
*   **Pruebas Playwright Asociadas:**
    *   [E-21](file:///d:/proyecto-ollas-comunes/frontend/e2e/workspace.spec.ts#L253): Test 21: Listado de Organizaciones.
    *   [E-22.1](file:///d:/proyecto-ollas-comunes/frontend/e2e/workspace.spec.ts#L263): Test 22.1: Creación de Nueva Organización (Éxito).
    *   [E-22.2](file:///d:/proyecto-ollas-comunes/frontend/e2e/workspace.spec.ts#L296): Test 22.2: Crear organización con nombre vacío (Falla).

### HU-14: Gestión de Ollas Comunes por Organización
*   **Fórmula:**
    *   **Como:** Administrador Municipal.
    *   **Quiero:** Registrar ollas comunes dentro del perfil de mi organización activa.
    *   **Para:** Ampliar la cobertura de asistencia social agregando nuevos puntos de distribución de alimentos.
*   **Criterios de Aceptación:**
    1. Se debe ingresar a la vista detallada de la organización para gestionar sus ollas asociadas.
    2. Al completar los campos (nombre, dirección), la olla común debe persistirse y reflejarse en la grilla visual.
*   **Pruebas Playwright Asociadas:**
    *   [E-23](file:///d:/proyecto-ollas-comunes/frontend/e2e/workspace.spec.ts#L302): Test 23: Creación de Olla Común.

### HU-15: Preferencias y Configuración de Usuario
*   **Fórmula:**
    *   **Como:** Usuario autenticado en el Workspace.
    *   **Quiero:** Modificar los datos de mi perfil de usuario y cambiar el tema visual (Modo Claro / Oscuro) del sistema.
    *   **Para:** Personalizar mi experiencia visual de acuerdo con el entorno de iluminación de trabajo.
*   **Criterios de Aceptación:**
    1. El panel de perfil debe cargar los inputs y permitir persistir actualizaciones básicas.
    2. El cambio de tema a "Oscuro" debe alternar las clases Tailwind para evitar fatiga visual nocturna.
*   **Pruebas Playwright Asociadas:**
    *   [E-24.1](file:///d:/proyecto-ollas-comunes/frontend/e2e/workspace.spec.ts#L336): Test 24.1: Mi Perfil - Edición de Datos (Mock) (Éxito).
    *   [E-24.2](file:///d:/proyecto-ollas-comunes/frontend/e2e/workspace.spec.ts#L355): Test 24.2: Edición de perfil con correo inválido (Falla).
    *   [E-25](file:///d:/proyecto-ollas-comunes/frontend/e2e/workspace.spec.ts#L366): Test 25: Preferencias - Cambio de Tema.
    *   [E-26](file:///d:/proyecto-ollas-comunes/frontend/e2e/workspace.spec.ts#L383): Test 26: Configuración - Enlaces de Acceso.

---

## ⚡ 4. Sincronización Offline y Resiliencia PWA

### HU-16: Sincronización Automática al Recuperar Conexión
*   **Fórmula:**
    *   **Como:** Lideresa de Olla Común.
    *   **Quiero:** Trabajar en la interfaz offline (padrón, entregas, inventario) y que al recuperar internet la PWA sincronice los cambios automáticamente con la base de datos central en la nube.
    *   **Para:** Evitar la pérdida de datos y la doble digitación manual al retornar del campo.
*   **Criterios de Aceptación:**
    1. Con el navegador configurado en offline, el sistema debe almacenar las escrituras locales en cola (`IndexedDB`) y reportar el estado en la píldora superior.
    2. Al reconectarse a internet, se deben despachar las colas asíncronamente y persistir los registros exitosos en Postgres.
    3. Si ocurre un conflicto de DNI duplicado, se debe desviar a la sección de alertas visuales en la interfaz del banner, impidiendo que la cola de sincronización se atasque.
*   **Pruebas Playwright Asociadas:**
    *   [E-31](file:///d:/proyecto-ollas-comunes/frontend/e2e/offline.spec.ts#L18-L91): Flujo completo de registro offline de beneficiario con reconexión.
    *   [E-32](file:///d:/proyecto-ollas-comunes/frontend/e2e/offline.spec.ts#L93-L177): Registro offline de entrega de ración con reconexión y sincronización.
    *   [E-33](file:///d:/proyecto-ollas-comunes/frontend/e2e/offline.spec.ts#L179-L272): Registro offline de movimiento de inventario.
    *   [E-34](file:///d:/proyecto-ollas-comunes/frontend/e2e/offline.spec.ts#L274-L335): Control de conflictos de sincronización (DNI duplicado) y visualización de alerta.
