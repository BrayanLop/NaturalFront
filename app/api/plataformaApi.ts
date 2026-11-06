import { logger } from '@/utils/logger';
import { notificarSesionExpirada } from '@/utils/sessionEvents';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { InternalAxiosRequestConfig } from 'axios';

/**
 * Cliente de Brar (servicio de plataforma del superadmin). Brar no emite tokens: acepta el mismo JWT de
 * Natural con rol 00, que el login guarda aparte en `tokenPlataforma` para que siga siendo válido aunque el
 * superadmin entre en modo soporte (donde `token` pasa a ser el de la empresa).
 */
export const PLATAFORMA_URL =
  process.env.EXPO_PUBLIC_PLATAFORMA_URL ?? 'https://brar.naturalback.vip';

const TIMEOUT = Number(process.env.EXPO_PUBLIC_API_TIMEOUT) || 50000; // ms

export const plataformaApi = axios.create({
  baseURL: PLATAFORMA_URL,
  timeout: TIMEOUT,
  headers: { 'Content-Type': 'application/json' },
});

plataformaApi.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await AsyncStorage.getItem('tokenPlataforma');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  } else {
    logger.warn('[Brar] Sin token de plataforma');
  }
  // Nunca se loguea el cuerpo: lleva contraseñas.
  logger.log(`[Brar Request] ${config.method?.toUpperCase()} ${config.url}`);
  return config;
});

plataformaApi.interceptors.response.use(
  (response) => response,
  async (error: any) => {
    const status = error.response?.status;
    logger.error(`[Brar Response Error] ${status} ${error.config?.url}`);
    // 401 con token enviado = el token del superadmin venció o es inválido: se cierra la sesión.
    if (status === 401 && error.config?.headers?.Authorization) {
      await notificarSesionExpirada();
    }
    return Promise.reject(error);
  }
);
