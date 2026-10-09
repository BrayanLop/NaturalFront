import { logger } from '@/utils/logger';
import { notificarSesionExpirada } from '@/utils/sessionEvents';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { CITAS_API_URL, CITAS_KEYS, citasConfigurado, MENSAJE_CITAS_NO_CONFIGURADO } from './citasConfig';
import { getDemoMode } from './demoApi';

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
  if (status === 502) return 'Natural no respondió. Intenta más tarde.';
  if (status >= 500) return 'Error del servicio de citas. Intenta más tarde.';
  return detalle || porDefecto;
}
