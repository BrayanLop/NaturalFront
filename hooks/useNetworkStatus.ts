import { logger, showError } from '@/utils/logger';
import { useEffect, useState } from 'react';

export interface NetworkStatus {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  type: string | null;
}

/**
 * Hook para detectar el estado de la red
 * Requiere: npm install @react-native-community/netinfo
 * 
 * Para usar este hook, primero instala la dependencia:
 * npm install @react-native-community/netinfo
 */
export function useNetworkStatus() {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isConnected: true,
    isInternetReachable: null,
    type: null,
  });

  useEffect(() => {
    let NetInfo: any;
    
    // Importación dinámica para evitar errores si no está instalado
    try {
      NetInfo = require('@react-native-community/netinfo').default;
    } catch (error) {
      logger.warn('NetInfo no está instalado. Instala con: npm install @react-native-community/netinfo');
      return;
    }

    // Verificar estado inicial
    NetInfo.fetch().then((state: any) => {
      setNetworkStatus({
        isConnected: state.isConnected ?? true,
        isInternetReachable: state.isInternetReachable,
        type: state.type,
      });
      
      if (!state.isConnected) {
        logger.warn('Sin conexión a internet');
        showError('No hay conexión a internet', 'Conexión perdida');
      }
    });

    // Suscribirse a cambios de estado de red
    const unsubscribe = NetInfo.addEventListener((state: any) => {
      const wasConnected = networkStatus.isConnected;
      const isNowConnected = state.isConnected ?? true;
      
      setNetworkStatus({
        isConnected: isNowConnected,
        isInternetReachable: state.isInternetReachable,
        type: state.type,
      });

      // Notificar cuando se pierde la conexión
      if (wasConnected && !isNowConnected) {
        logger.warn('Conexión a internet perdida');
        showError('Se perdió la conexión a internet', 'Sin conexión');
      }
      
      // Notificar cuando se recupera la conexión
      if (!wasConnected && isNowConnected) {
        logger.info('Conexión a internet recuperada');
      }
    });

    return () => unsubscribe?.();
  }, []);

  return networkStatus;
}
