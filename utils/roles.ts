
// Constantes de roles
export const ROLES = {
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
