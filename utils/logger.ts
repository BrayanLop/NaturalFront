import { Alert, Platform } from 'react-native';

// Configuración de logging
const isDevelopment = __DEV__;

// Logger condicional que solo funciona en desarrollo
export const logger = {
  log: (...args: any[]) => {
    if (isDevelopment) {
      console.log('[LOG]', ...args);
    }
  },
  
  error: (...args: any[]) => {
    if (isDevelopment) {
      console.error('[ERROR]', ...args);
    }
  },
  
  warn: (...args: any[]) => {
    if (isDevelopment) {
      console.warn('[WARN]', ...args);
    }
  },
  
  info: (...args: any[]) => {
    if (isDevelopment) {
      console.info('[INFO]', ...args);
    }
  },
};

// Mostrar mensajes de error al usuario
export function showError(message: string, title: string = 'Error'): void {
  if (Platform.OS === 'web') {
    window.alert(`${title}: ${message}`);
  } else {
    Alert.alert(title, message);
  }
}

// Mostrar mensajes de éxito
export function showSuccess(message: string, title: string = 'Éxito'): void {
  if (Platform.OS === 'web') {
    window.alert(`${title}: ${message}`);
  } else {
    Alert.alert(title, message);
  }
}

// Mostrar confirmación
export async function showConfirm(
  message: string,
  title: string = 'Confirmar'
): Promise<boolean> {
  if (Platform.OS === 'web') {
    return window.confirm(`${title}\n\n${message}`);
  } else {
    return new Promise((resolve) => {
      Alert.alert(
        title,
        message,
        [
          { text: 'Cancelar', onPress: () => resolve(false), style: 'cancel' },
          { text: 'Confirmar', onPress: () => resolve(true), style: 'default' },
        ]
      );
    });
  }
}

// Manejo de errores de API con códigos HTTP específicos
export function handleApiError(error: any): void {
  logger.error('API Error:', error);
  
  const status = error?.response?.status;
  const message = error?.response?.data?.message || error?.message;
  
  // Mensajes específicos por código HTTP
  switch (status) {
    case 400:
      showError(message || 'Solicitud inválida. Verifica los datos ingresados.', 'Error de validación');
      break;
    case 401:
      showError('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.', 'Sesión expirada');
      break;
    case 403:
      showError('No tienes permisos para realizar esta acción.', 'Acceso denegado');
      break;
    case 404:
      showError(message || 'El recurso solicitado no fue encontrado.', 'No encontrado');
      break;
    case 422:
      showError(message || 'Datos inválidos. Verifica la información.', 'Error de validación');
      break;
    case 500:
      showError('Error interno del servidor. Intenta nuevamente más tarde.', 'Error del servidor');
      break;
    case 503:
      showError('El servicio no está disponible. Intenta más tarde.', 'Servicio no disponible');
      break;
    default:
      if (!status) {
        showError('No se pudo conectar al servidor. Verifica tu conexión a internet.', 'Error de conexión');
      } else {
        showError(message || 'Ocurrió un error inesperado. Intenta nuevamente.', 'Error');
      }
  }
}
