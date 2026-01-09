import { Platform, Alert } from 'react-native';

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

// Manejo de errores de API
export function handleApiError(error: any): void {
  logger.error('API Error:', error);
  
  const message = error?.response?.data?.message || 
                  error?.message || 
                  'Ocurrió un error inesperado';
  
  showError(message);
}
