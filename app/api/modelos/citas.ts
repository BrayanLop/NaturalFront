/**
 * Modelos del backend de Citas (multi-tenant).
 * Coinciden con los DTOs del API: Empresas, Usuarios, Roles, Servicios, Citas.
 */

/** Modo de acceso elegido en el login del módulo de Citas. */
export type CitasMode = 'empresa' | 'cliente';

export interface EmpresaCita {
  id: string; // código del tenant (ej: "ACME")
  nombre: string;
  activo: boolean;
}

export interface UsuarioCita {
  id: number;
  nombreUsuario: string;
}

export interface RolCita {
  id: number;
  nombreRol: string;
}

export interface ServicioCita {
  idServicio: number;
  nombreServicio: string;
  valor: number;
  tiempoEstimado: number; // minutos
}

export interface CitaCita {
  idCita: number;
  idCliente: number;
  idEmpleado: number;
  estado: string;
  fechaCita: string; // ISO date-time
  horaEstimadaCita: string; // "HH:mm:ss"
  horaEstimadaFin?: string | null;
  observaciones?: string | null;
}

export interface TokenResponseCita {
  token: string;
  tenant: string;
  expiraUtc: string;
}

/** Estados posibles de una cita (el backend crea "Pendiente" por defecto). */
export const ESTADOS_CITA = [
  'Pendiente',
  'Confirmada',
  'Completada',
  'Cancelada',
] as const;

export type EstadoCita = (typeof ESTADOS_CITA)[number];
