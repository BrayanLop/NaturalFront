
// Constantes de roles
export const ROLES = {
  ADMIN: '01',
  TRABAJADOR: '02',
} as const;

// Type helper para roles
export type RolType = typeof ROLES[keyof typeof ROLES];

// Verificar si es admin
export function isAdmin(rol: string | undefined): boolean {
  return rol === ROLES.ADMIN || rol === '1';
}

// Verificar si es trabajador
export function isTrabajador(rol: string | undefined): boolean {
  return rol === ROLES.TRABAJADOR || rol === '2';
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
    default:
      return 'Desconocido';
  }
}
