import { logger } from '@/utils/logger';
import { AxiosError } from 'axios';

interface RetryConfig {
  maxRetries?: number;
  retryDelay?: number;
  retryableStatuses?: number[];
}

const defaultRetryConfig: Required<RetryConfig> = {
  maxRetries: 3,
  retryDelay: 1000, // 1 segundo
  retryableStatuses: [408, 429, 500, 502, 503, 504], // Errores recuperables
};

/**
 * Determina si un error es recuperable y puede reintentar
 */
export function isRetryableError(error: AxiosError): boolean {
  if (!error.response) {
    // Error de red (sin respuesta) - siempre reintentar
    return true;
  }
  
  const status = error.response.status;
  return defaultRetryConfig.retryableStatuses.includes(status);
}

/**
 * Retrasa la ejecución por los milisegundos especificados
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Calcula el tiempo de espera con backoff exponencial
 */
function getRetryDelay(attempt: number, baseDelay: number): number {
  // Backoff exponencial: 1s, 2s, 4s, 8s...
  return baseDelay * Math.pow(2, attempt - 1);
}

/**
 * Ejecuta una función con lógica de reintentos
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: RetryConfig = {}
): Promise<T> {
  const { maxRetries, retryDelay } = { ...defaultRetryConfig, ...config };
  
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      
      // Si no es el último intento y el error es recuperable
      if (attempt < maxRetries && isRetryableError(error)) {
        const waitTime = getRetryDelay(attempt, retryDelay);
        logger.warn(
          `Reintento ${attempt}/${maxRetries} después de ${waitTime}ms`,
          error?.response?.status || 'Error de red'
        );
        await delay(waitTime);
        continue;
      }
      
      // Si es el último intento o no es recuperable, lanzar error
      throw error;
    }
  }
  
  throw lastError;
}

/**
 * Wrapper para requests de Axios con reintentos automáticos
 */
export async function axiosWithRetry<T>(
  requestFn: () => Promise<T>,
  retryConfig?: RetryConfig
): Promise<T> {
  return withRetry(requestFn, retryConfig);
}
