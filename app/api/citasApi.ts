import { logger, showError } from '@/utils/logger';
import { notificarSesionExpirada } from '@/utils/sessionEvents';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { CITAS_API_URL, CITAS_KEYS, citasConfigurado, MENSAJE_CITAS_NO_CONFIGURADO } from './citasConfig';
import { getDemoMode } from './demoApi';
import type {
  BloqueoAgenda,
  Cita,
  CrearBloqueoRequest,
  CrearCitaRequest,
  DiasDisponibles,
  DisponibilidadDia,
  FranjaHorario,
  HorarioEmpleado,
  ReprogramarCitaRequest,
} from './modelos/citas';

/**
 * Clientes HTTP del backend de Citas (separados del cliente de Natural de `api.ts`).
 *
 * - `citasPersonalApi`: personal de Natural (roles 01/02/03). Envía el MISMO token de Natural
 *   (AsyncStorage 'token'); Citas lo valida con la clave de Natural. Un 401 con token cierra la
 *   sesión de Natural con `notificarSesionExpirada()`, igual que `api.ts`.
 * - `citasClienteApi`: clientes externos. Envía el token propio de Citas (`citas_token`). Un 401
 *   con token cierra SOLO la sesión de cliente de citas.
 *
 * El modo demo de Natural no simula este backend: el cliente de personal rechaza las peticiones
 * en modo demo (las pantallas además ocultan la entrada).
 */

type ModoCitas = 'personal' | 'cliente';

const CITAS_TIMEOUT = Number(process.env.EXPO_PUBLIC_API_TIMEOUT) || 50000;

/** Error de configuración/entorno que las pantallas muestran tal cual. */
export class CitasNoDisponibleError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CitasNoDisponibleError';
  }
}

// ---- Puente para cerrar la sesión del cliente de citas ante un 401 ----

type Handler = () => Promise<void> | void;
let handlerClienteExpirado: Handler | null = null;

/** `CitasAuthProvider` registra aquí su logout. Devuelve la función para desregistrar. */
export function registrarHandlerClienteCitasExpirado(handler: Handler): () => void {
  handlerClienteExpirado = handler;
  return () => {
    if (handlerClienteExpirado === handler) handlerClienteExpirado = null;
  };
}

async function cerrarSesionClienteCitas(): Promise<void> {
  try {
    if (handlerClienteExpirado) {
      await handlerClienteExpirado();
    } else {
      await AsyncStorage.multiRemove(Object.values(CITAS_KEYS));
    }
  } catch (e) {
    logger.error('[CitasAPI] Error cerrando la sesión de cliente', e);
  }
}

function crearCliente(modo: ModoCitas): AxiosInstance {
  const instancia = axios.create({
    baseURL: CITAS_API_URL || undefined,
    timeout: CITAS_TIMEOUT,
    headers: { 'Content-Type': 'application/json' },
  });

  instancia.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
    if (!citasConfigurado) {
      throw new CitasNoDisponibleError(MENSAJE_CITAS_NO_CONFIGURADO);
    }

    if (modo === 'personal') {
      if (await getDemoMode()) {
        throw new CitasNoDisponibleError('La agenda de citas no está disponible en modo demo.');
      }
      const token = await AsyncStorage.getItem('token');
      if (token) config.headers['Authorization'] = `Bearer ${token}`;
    } else {
      // Las peticiones anónimas (login, registro, empresas) no requieren token, pero si hay uno se envía.
      // Si la llamada ya trae un token explícito (p. ej. select-empresa con el de login), se respeta.
      const token = await AsyncStorage.getItem(CITAS_KEYS.token);
      if (token && !config.headers['Authorization']) config.headers['Authorization'] = `Bearer ${token}`;
    }

    logger.log(`[CitasAPI ${modo}] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  });

  instancia.interceptors.response.use(
    (response) => {
      logger.log(`[CitasAPI ${modo}] ${response.status} ${response.config?.url}`);
      return response;
    },
    async (error: any) => {
      if (error instanceof CitasNoDisponibleError) return Promise.reject(error);

      const status = error?.response?.status;
      logger.error(`[CitasAPI ${modo}] ${status ?? 'sin respuesta'} ${error?.config?.url}`, error);

      if (status === 401) {
        const url = String(error?.config?.url ?? '');
        const esLoginCliente = url.includes('/Auth/login') || url.includes('/Auth/register');
        const enviabaToken = Boolean(error?.config?.headers?.Authorization);
        if (enviabaToken && !esLoginCliente) {
          if (modo === 'personal') {
            logger.warn('[CitasAPI] Token de Natural rechazado - sesión expirada');
            await notificarSesionExpirada();
          } else {
            logger.warn('[CitasAPI] Token de cliente rechazado - se cierra la sesión de citas');
            await cerrarSesionClienteCitas();
          }
        }
      }
      return Promise.reject(error);
    }
  );

  return instancia;
}

export const citasPersonalApi = crearCliente('personal');
export const citasClienteApi = crearCliente('cliente');

// ---- Utilidades de errores ----

function detalleProblema(error: any): string | undefined {
  const data = error?.response?.data;
  if (!data) return undefined;
  if (typeof data === 'string') return data.trim() || undefined;
  if (typeof data.detail === 'string' && data.detail.trim()) return data.detail;
  if (data.errors && typeof data.errors === 'object') {
    const primero = Object.values(data.errors as Record<string, string[]>)[0];
    if (Array.isArray(primero) && primero[0]) return primero[0];
  }
  if (typeof data.title === 'string' && data.title.trim()) return data.title;
  if (typeof data.message === 'string') return data.message;
  return undefined;
}

/**
 * 403 sin mensaje del backend: lo produce la política de autorización cuando la empresa aún
 * no activó la agenda (el personal no tiene Usuario en Citas). Los 403 de reglas de negocio
 * (personal inactivo, cita ajena...) traen `detail`.
 */
export function esAgendaNoActivada(error: any): boolean {
  return error?.response?.status === 403 && !detalleProblema(error);
}

/** Mensaje en español para mostrar al usuario a partir de un error de Citas. */
export function mensajeErrorCitas(error: any, porDefecto = 'Ocurrió un error inesperado.'): string {
  if (error instanceof CitasNoDisponibleError) return error.message;
  const status = error?.response?.status;
  const detalle = detalleProblema(error);
  if (!status) return 'No se pudo conectar con el servicio de citas. Verifica tu conexión.';
  if (status === 401) return detalle || 'Tu sesión expiró. Inicia sesión nuevamente.';
  if (status === 403) return detalle || 'No tienes permiso para esta acción o la agenda de la empresa no está activada.';
  if (status === 404) return detalle || 'No se encontró el recurso solicitado.';
  if (status === 409) return detalle || 'El horario elegido ya no está disponible.';
  if (status === 502) return 'Natural no respondió. Intenta más tarde.';
  if (status >= 500) return 'Error del servicio de citas. Intenta más tarde.';
  return detalle || porDefecto;
}

/** 409 del backend: turno tomado, fuera de horario, cruce con cita/bloqueo o carrera. */
export function esConflictoCitas(error: any): boolean {
  return error?.response?.status === 409;
}

// ---- Endpoints de agenda (Fase 4). Todas las fechas/horas en hora local del negocio ----

/** Horario semanal de un empleado (personal o cliente). */
export async function obtenerHorarioEmpleado(api: AxiosInstance, usuarioId: number): Promise<HorarioEmpleado> {
  const { data } = await api.get<HorarioEmpleado>(`/AgendaEmpleado/${usuarioId}`);
  return { ...data, franjas: data?.franjas ?? [] };
}

/** Reemplaza el horario completo (solo personal; `[]` = no trabaja). */
export async function guardarHorarioEmpleado(usuarioId: number, franjas: FranjaHorario[]): Promise<HorarioEmpleado> {
  const { data } = await citasPersonalApi.put<HorarioEmpleado>(`/AgendaEmpleado/${usuarioId}`, { franjas });
  return { ...data, franjas: data?.franjas ?? [] };
}

/** Bloqueos de un empleado entre dos fechas "YYYY-MM-DD" (solo personal). */
export async function listarBloqueos(usuarioId: number, desde: string, hasta: string): Promise<BloqueoAgenda[]> {
  const { data } = await citasPersonalApi.get<BloqueoAgenda[]>(`/AgendaEmpleado/${usuarioId}/bloqueos`, {
    params: { desde, hasta },
  });
  return data ?? [];
}

/** Crea un bloqueo (solo personal). 409 si se cruza con citas activas. */
export async function crearBloqueo(usuarioId: number, bloqueo: CrearBloqueoRequest): Promise<BloqueoAgenda> {
  const { data } = await citasPersonalApi.post<BloqueoAgenda>(`/AgendaEmpleado/${usuarioId}/bloqueos`, bloqueo);
  return data;
}

export async function eliminarBloqueo(usuarioId: number, idBloqueo: number): Promise<void> {
  await citasPersonalApi.delete(`/AgendaEmpleado/${usuarioId}/bloqueos/${idBloqueo}`);
}

/** Horas libres de un día para un empleado y unos servicios (personal o cliente). */
export async function obtenerDisponibilidad(
  api: AxiosInstance,
  empleadoId: number,
  fecha: string,
  idServicios: number[]
): Promise<DisponibilidadDia> {
  const { data } = await api.get<DisponibilidadDia>('/Disponibilidad', {
    params: { empleadoId, fecha, idServicios: idServicios.join(',') },
  });
  return { ...data, horas: data?.horas ?? [] };
}

/** Días con turnos libres entre `desde` y `hasta` (máx. 62 días; personal o cliente). */
export async function obtenerDiasDisponibles(
  api: AxiosInstance,
  empleadoId: number,
  desde: string,
  hasta: string,
  idServicios: number[]
): Promise<DiasDisponibles> {
  const { data } = await api.get<DiasDisponibles>('/Disponibilidad/dias', {
    params: { empleadoId, desde, hasta, idServicios: idServicios.join(',') },
  });
  return { ...data, dias: data?.dias ?? [] };
}

/** Crea una cita (cliente para sí mismo o personal 01/03). */
export async function crearCita(api: AxiosInstance, cita: CrearCitaRequest): Promise<Cita> {
  const { data } = await api.post<Cita>('/Citas', cita);
  return data;
}

/** Reprograma una cita (01/03 cualquier cita activa; cliente sus citas Pendiente). */
export async function reprogramarCita(api: AxiosInstance, idCita: number, cambios: ReprogramarCitaRequest): Promise<Cita> {
  const { data } = await api.put<Cita>(`/Citas/${idCita}`, cambios);
  return data;
}

/**
 * Muestra el error de crear/reprogramar una cita (con el `detail` del backend) y devuelve
 * 'conflicto' si fue un 409, para que el formulario recargue las horas libres.
 */
export function mostrarErrorEnvioCita(error: any, porDefecto: string): 'conflicto' | 'error' {
  const conflicto = esConflictoCitas(error);
  showError(mensajeErrorCitas(error, porDefecto), conflicto ? 'Turno no disponible' : 'Error');
  return conflicto ? 'conflicto' : 'error';
}
