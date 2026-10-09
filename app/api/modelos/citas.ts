/**
 * Modelos del backend de Citas (rama feature/integracion-natural, carpeta Citas.Application).
 * Los nombres van en camelCase tal como los serializa ASP.NET Core.
 */

// ---- Autenticación de clientes externos ----

export interface RegistroClienteRequest {
  nombre: string;
  apellido: string;
  email: string;
  celular?: string | null;
  /** En claro: el backend la hashea (IPasswordHasher). Viaja solo por HTTPS. */
  password: string;
}

export interface LoginClienteRequest {
  email: string;
  password: string;
}

/** Respuesta de /Auth/register y /Auth/login (token sin empresa). */
export interface ClienteAuthResponse {
  token: string;
  personaId: number;
  nombre: string;
  expiraUtc: string;
}

/** Respuesta de /Auth/select-empresa (token con tenant). */
export interface SelectEmpresaResponse {
  token: string;
  tenant: string;
  empresaNombre: string;
  userId: number;
  expiraUtc: string;
}

// ---- Empresas ----

export interface EmpresaPublica {
  id: string;
  nombre: string;
}

export interface EmpresaCitas {
  id: string;
  nombre: string;
  activo: boolean;
}

// ---- Usuarios (clientes y personal dentro del tenant) ----

export interface UsuarioCitas {
  id: number;
  nombreUsuario: string;
  personaId?: number | null;
  /** Id de la persona en Natural: solo lo tiene el personal. */
  personaNaturalId?: number | null;
  rol?: string | null;
  activo: boolean;
  email?: string | null;
  celular?: string | null;
}

// ---- Servicios (vienen de Natural; en Citas solo se ajustan) ----

export interface ServicioCitas {
  idServicio: number;
  servicioNaturalId: number;
  nombreServicio: string;
  valor: number;
  /** Minutos. */
  tiempoEstimado: number;
  activo: boolean;
  disponibleEnNatural: boolean;
  agendable: boolean;
}

export interface ActualizarServicioRequest {
  tiempoEstimado?: number;
  activo?: boolean;
}

// ---- Sincronización ----

export interface ResumenCambios {
  creados: number;
  actualizados: number;
  desactivados: number;
}

export interface ResumenSincronizacion {
  servicios: ResumenCambios;
  personal: ResumenCambios;
}

// ---- Citas ----

export interface DetalleCita {
  idServicio: number;
  nombreServicio?: string | null;
  valorServicio: number;
  tiempoEstimado: number;
}

export interface Cita {
  idCita: number;
  idCliente: number;
  idEmpleado: number;
  estado: string;
  /** DateTime ISO; solo importa la parte de la fecha. */
  fechaCita: string;
  /** TimeSpan "HH:mm:ss". */
  horaEstimadaCita: string;
  horaEstimadaFin?: string | null;
  observaciones?: string | null;
  nombreCliente?: string | null;
  nombreEmpleado?: string | null;
  servicios: DetalleCita[];
  /** Minutos. */
  duracionTotal: number;
  valorTotal: number;
}

export interface CrearCitaRequest {
  /** El cliente lo puede enviar en 0: el backend usa su propio usuario. */
  idCliente: number;
  idEmpleado: number;
  /** "YYYY-MM-DDT00:00:00". */
  fechaCita: string;
  /** "HH:mm:ss". */
  horaEstimadaCita: string;
  observaciones?: string | null;
  idServicios: number[];
}

/** Estados válidos (Citas.Domain/Agendamiento/EstadoCita.cs). */
export const ESTADOS_CITA = ['Pendiente', 'Confirmada', 'Atendida', 'Cancelada'] as const;
export type EstadoCita = (typeof ESTADOS_CITA)[number];

/** Transiciones permitidas por el backend desde cada estado. */
export const TRANSICIONES_CITA: Record<string, EstadoCita[]> = {
  Pendiente: ['Confirmada', 'Cancelada'],
  Confirmada: ['Atendida', 'Cancelada'],
  Atendida: [],
  Cancelada: [],
};
