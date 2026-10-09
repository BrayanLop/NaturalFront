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
  /** "YYYY-MM-DDT00:00:00" en hora local del negocio; solo importa la parte de la fecha. */
  fechaCita: string;
  /** "HH:mm:ss" local del negocio. */
  horaEstimadaCita: string;
  /** "HH:mm:ss" local del negocio. */
  horaEstimadaFin?: string | null;
  /** Instante de inicio con el offset del negocio ("2026-10-20T09:00:00-05:00"). */
  inicio?: string | null;
  /** Instante de fin con el offset del negocio. */
  fin?: string | null;
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
  /** "YYYY-MM-DD" (hora local del negocio). */
  fechaCita: string;
  /** "HH:mm:ss" (hora local del negocio). */
  horaEstimadaCita: string;
  observaciones?: string | null;
  /** Mínimo uno. */
  idServicios: number[];
}

/** Body de PUT /Citas/{id} (reprogramar): lo omitido se conserva. */
export interface ReprogramarCitaRequest {
  fechaCita?: string;
  horaEstimadaCita?: string;
  idEmpleado?: number;
  idServicios?: number[];
  observaciones?: string | null;
}

// ---- Horario semanal, bloqueos y disponibilidad (hora local del negocio) ----

/** Franja de trabajo. `dia`: 0 = domingo ... 6 = sábado (como Date.getDay()). */
export interface FranjaHorario {
  dia: number;
  /** "HH:mm:ss". */
  horaInicio: string;
  /** "HH:mm:ss". */
  horaFin: string;
}

/** GET/PUT /AgendaEmpleado/{usuarioId}. */
export interface HorarioEmpleado {
  idEmpleado: number;
  nombreEmpleado?: string | null;
  zonaHoraria?: string | null;
  franjas: FranjaHorario[];
}

/** Bloqueo de agenda. `inicio`/`fin` vienen con el offset del negocio. */
export interface BloqueoAgenda {
  idBloqueo: number;
  idEmpleado: number;
  inicio: string;
  fin: string;
  motivo?: string | null;
}

/** POST /AgendaEmpleado/{usuarioId}/bloqueos. Sin offset = hora local del negocio. */
export interface CrearBloqueoRequest {
  inicio: string;
  fin: string;
  motivo?: string | null;
}

/** GET /Disponibilidad. */
export interface DisponibilidadDia {
  idEmpleado: number;
  fecha: string;
  /** Minutos. */
  duracionTotal: number;
  intervaloMinutos: number;
  zonaHoraria?: string | null;
  /** Horas libres "HH:mm:ss". */
  horas: string[];
}

/** GET /Disponibilidad/dias. */
export interface DiasDisponibles {
  idEmpleado: number;
  desde?: string;
  hasta?: string;
  duracionTotal: number;
  /** Días con al menos un turno libre ("YYYY-MM-DD"). */
  dias: string[];
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
