import { logger } from '@/utils/logger';
import { axiosWithRetry } from '@/utils/retry';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { CITAS_API_URL, CITAS_KEYS } from './citasConfig';

/**
 * Cliente HTTP dedicado al backend de Citas (separado del cliente de Natural).
 * Inyecta el token JWT propio del módulo de Citas en cada petición.
 */
export const citasApi = axios.create({
  baseURL: CITAS_API_URL,
  timeout: 50000,
  headers: {
    'Content-Type': 'application/json',
  },
});

citasApi.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await AsyncStorage.getItem(CITAS_KEYS.token);
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    logger.log(`[CitasAPI] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error: any) => {
    logger.error('[CitasAPI Request Error]', error);
    return Promise.reject(error);
  }
);

citasApi.interceptors.response.use(
  (response) => {
    logger.log(`[CitasAPI Response] ${response.status} ${response.config?.url}`);
    return response;
  },
  async (error: any) => {
    const status = error.response?.status;
    logger.error(`[CitasAPI Response Error] ${status} ${error.config?.url}`, error);
    return Promise.reject(error);
  }
);

/** Helper con reintentos automáticos. */
export async function citasApiWithRetry<T = any>(
  requestFn: () => Promise<AxiosResponse<T>>,
  maxRetries: number = 3
): Promise<AxiosResponse<T>> {
  return axiosWithRetry(requestFn, { maxRetries });
}
