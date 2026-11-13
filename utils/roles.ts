
// Constantes de roles
export const ROLES = {
  PLATAFORMA: '00', // Superadmin de la plataforma (no pertenece a una empresa)
  ADMIN: '01',
  TRABAJADOR: '02',
  SUPER_EMPLEADO: '03',
} as const;

// Type helper para roles
export type RolType = typeof ROLES[keyof typeof ROLES];

// Verificar si es admin (incluye super empleado)
export function isAdmin(rol: string | undefined): boolean {
  return rol === ROLES.ADMIN || rol === '1' || rol === ROLES.SUPER_EMPLEADO || rol === '3';
}

// Verificar si es trabajador
export function isTrabajador(rol: string | undefined): boolean {
  return rol === ROLES.TRABAJADOR || rol === '2';
}

// Verificar si es super empleado
export function isSuperEmpleado(rol: string | undefined): boolean {
  return rol === ROLES.SUPER_EMPLEADO || rol === '3';
}

// Verificar si puede registrar servicios (trabajador o super empleado)
export function puedeRegistrarServicios(rol: string | undefined): boolean {
  return isTrabajador(rol) || isSuperEmpleado(rol);
}

// Obtener nombre del rol
export function getRoleName(rol: string): string {
  switch (rol) {
    case ROLES.PLATAFORMA:
      return 'Plataforma';
    case ROLES.ADMIN:
    case '1':
      return 'Administrador';
    case ROLES.TRABAJADOR:
    case '2':
      return 'Trabajador';
    case ROLES.SUPER_EMPLEADO:
    case '3':
      return 'Super Empleado';
    default:
      return 'Desconocido';
  }
}

// Verificar si es superadmin de plataforma (gestiona tenants, no el negocio de una empresa)
export function isPlataforma(rol: string | undefined): boolean {
  return rol === ROLES.PLATAFORMA || rol === '0';
}

// Solo el administrador (01) de la empresa gestiona accesos; el super empleado (03) no
export function puedeGestionarAccesos(rol: string | undefined): boolean {
  return rol === ROLES.ADMIN || rol === '1';
}
