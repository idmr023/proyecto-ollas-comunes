/**
 * Matriz de permisos rol x recurso x accion.
 *
 * Punto unico de verdad sobre quien puede hacer que. Antes esta informacion
 * estaba implicita y dispersa en condicionales dentro de los routers, lo que
 * hacia imposible responder "que puede hacer un supervisor" sin leer todo el
 * backend.
 *
 * Ojo con la distincion:
 *   - Este modulo decide el acceso por ROL (¿puede esta clase de usuario
 *     invocar esta accion?), y se aplica con `requireRole`.
 *   - El alcance por FILA (¿sobre que registros concretos?) no cabe aqui:
 *     una `lideresa_olla` solo opera sobre los beneficiarios de su propia olla,
 *     y eso se resuelve en el router consultando la olla asignada.
 */

export const ROLES = {
  ADMIN: 'admin_municipal',
  SUPERVISOR: 'supervisor',
  LIDERESA: 'lideresa_olla',
} as const

export type Role = (typeof ROLES)[keyof typeof ROLES]

/** Todos los roles con acceso operativo al sistema. */
export const ALL_ROLES: readonly Role[] = [ROLES.ADMIN, ROLES.SUPERVISOR, ROLES.LIDERESA]

/** Roles con capacidad administrativa sobre la organizacion. */
export const ADMINISTRATIVE_ROLES: readonly Role[] = [ROLES.ADMIN, ROLES.SUPERVISOR]

export const PERMISSIONS = {
  /** Alta de usuarios. El rol concreto asignable lo acota el servicio de auth. */
  users: {
    create: ADMINISTRATIVE_ROLES,
  },

  /** La organizacion (tenant) en si. */
  organizations: {
    read: ALL_ROLES,
    create: [ROLES.ADMIN],
    update: [ROLES.ADMIN],
    changeStatus: [ROLES.ADMIN],
  },

  ollas: {
    read: ALL_ROLES,
    create: ADMINISTRATIVE_ROLES,
  },

  /** Padron de beneficiarios: incluye datos de salud y DNI. */
  beneficiaries: {
    read: ALL_ROLES,
    create: ALL_ROLES,
    update: ALL_ROLES,
    delete: ALL_ROLES,
  },

  inventory: {
    read: ALL_ROLES,
    createMovement: ALL_ROLES,
  },

  alerts: {
    read: ALL_ROLES,
    update: ADMINISTRATIVE_ROLES,
  },

  /** Operacion diaria de la olla desde la app movil. */
  deliveries: {
    create: ALL_ROLES,
  },

  documents: {
    upload: ALL_ROLES,
  },

  /** Telemetria del cliente offline. */
  notifications: {
    backup: ALL_ROLES,
    reportDataLoss: ALL_ROLES,
  },
} as const
