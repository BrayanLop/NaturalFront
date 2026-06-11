import { logger } from '@/utils/logger';
import { axiosWithRetry } from '@/utils/retry';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { getDemoMode, handleDemoRequest } from './demoApi';

export const API_URL = 'https://naturalback-production.up.railway.app/api';
//export const API_URL = 'https://naturalback.vip/api';
//const API_URL = 'https://localhost:7049/api';
//const API_URL = 'http://45.236.128.205:5000/api';

// Error personalizado para modo demo
class DemoModeError extends Error {
  response: AxiosResponse;
  constructor(response: AxiosResponse) {
    super('DEMO_MODE');
    this.name = 'DemoModeError';
    this.response = response;
  }
}

export const api = axios.create({
  baseURL: API_URL,
  timeout: 50000, // 30 segundos
  headers: {
    //'ngrok-skip-browser-warning': 'true',
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Agregar headers y token
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Si estamos en modo demo, interceptar el request
    const isDemo = await getDemoMode();
    if (isDemo) {
      const demoResponse = await handleDemoRequest(config);
      if (demoResponse) {
        // Lanzar error especial con la respuesta mock
        throw new DemoModeError(demoResponse);
      }
      return config;
    }

    const empresaId = await AsyncStorage.getItem('empresaId');
    const token = await AsyncStorage.getItem('token');
    
    if (empresaId) {
      config.headers['empresaId'] = empresaId;
    }
    
    // Agregar token JWT si existe
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
      logger.log(`[API] Token incluido: ${token.substring(0, 20)}...`);
    } else {
      logger.warn('[API] Sin token JWT');
    }
    
    // Si es FormData, eliminar el Content-Type para que axios lo establezca automáticamente
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
      logger.log('[API] Detectado FormData - Content-Type será manejado automáticamente');
    }
    
    logger.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error: any) => {
    // Si es un error de modo demo, devolver la respuesta mock
    if (error instanceof DemoModeError || error?.name === 'DemoModeError') {
      logger.log(`[DEMO Response] ${error.response.status}`);
      return Promise.resolve(error.response);
    }
    logger.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

// Response interceptor - Manejo global de errores y reintentos
api.interceptors.response.use(
  (response) => {
    logger.log(`[API Response] ${response.status} ${response.config?.url || 'demo'}`);
    return response;
  },
  async (error: any) => {
    // Si es un error de modo demo (por si llegó aquí), devolver la respuesta mock
    if (error instanceof DemoModeError || error?.name === 'DemoModeError') {
      return Promise.resolve(error.response);
    }

    const status = error.response?.status;
    const url = error.config?.url;
    
    logger.error(`[API Response Error] ${status} ${url}`, error);
    
    // Manejo específico de errores
    if (status === 401) {
      // Token expirado o no autorizado
      logger.warn('No autorizado - Sesión expirada');
      // Aquí podrías limpiar el storage y redirigir al login
      // await AsyncStorage.clear();
      // router.push('/login');
    } else if (status === 403) {
      logger.warn('Acceso prohibido');
    } else if (status === 404) {
      logger.warn('Recurso no encontrado');
    } else if (status === 500) {
      logger.error('Error interno del servidor');
    } else if (status === 503) {
      logger.error('Servicio no disponible');
    } else if (!status) {
      logger.error('Error de red - Sin conexión al servidor');
    }
    
    return Promise.reject(error);
  }
);

/**
 * Helper para hacer requests con reintentos automáticos
 * Uso: await apiWithRetry(() => api.get('/endpoint'))
 */
export async function apiWithRetry<T = any>(
  requestFn: () => Promise<AxiosResponse<T>>,
  maxRetries: number = 3
): Promise<AxiosResponse<T>> {
  return axiosWithRetry(requestFn, { maxRetries });
}