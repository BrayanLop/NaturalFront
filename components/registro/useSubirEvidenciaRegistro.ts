import { api, API_URL } from '@/app/api/api';
import { getDemoMode } from '@/app/api/demoApi';
import type { RegistroServicio } from '@/app/api/modelos/registroServicio';
import { logger, showError, showSuccess } from '@/utils/logger';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import { useCallback, useState } from 'react';
import { Platform } from 'react-native';
import { useSeleccionArchivos } from './useSeleccionArchivos';

const MIME_POR_EXTENSION: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  pdf: 'application/pdf',
};

/**
 * Estado y acciones del modal "Subir evidencia" de la lista de registros.
 * `onSubidas` se llama tras una subida real correcta (recarga la lista).
 */
export function useSubirEvidenciaRegistro(onSubidas: () => void) {
  const seleccion = useSeleccionArchivos();
  const { archivos, setArchivos } = seleccion;
  const [visible, setVisible] = useState(false);
  const [registro, setRegistro] = useState<RegistroServicio | null>(null);
  const [subiendo, setSubiendo] = useState(false);

  const abrir = useCallback(
    (r: RegistroServicio) => {
      setRegistro(r);
      setArchivos([]);
      setVisible(true);
    },
    [setArchivos]
  );

  const cerrar = useCallback(() => {
    setVisible(false);
    setArchivos([]);
  }, [setArchivos]);

  const confirmar = async () => {
    if (!registro || archivos.length === 0) return;

    // En modo demo no subimos archivos reales al servidor.
    if (await getDemoMode()) {
      showSuccess('Evidencias subidas correctamente');
      setVisible(false);
      setArchivos([]);
      setRegistro(null);
      return;
    }

    setSubiendo(true);
    try {
      const [token, empresaId] = await Promise.all([AsyncStorage.getItem('token'), AsyncStorage.getItem('empresaId')]);

      for (const archivo of archivos) {
        // Resolver el tipo MIME a partir de la extensión si no viene.
        let mimeType = archivo.type;
        if (!mimeType || mimeType === 'application/octet-stream') {
          const extension = archivo.name.split('.').pop()?.toLowerCase();
          mimeType = MIME_POR_EXTENSION[extension || ''] || 'image/jpeg';
        }

        if (Platform.OS === 'web' || archivo.uri.startsWith('blob:')) {
          // Web: convertir a File y enviar con axios.
          const formData = new FormData();
          formData.append('registroServicioId', registro.id.toString());
          const response = await fetch(archivo.uri);
          const blob = await response.blob();
          const file = new File([blob], archivo.name, { type: mimeType });
          formData.append('archivo', file);
          await api.post('/Evidencia/SubirEvidencia', formData);
        } else {
          // Mobile (iOS/Android): subir directo desde disco con uploadAsync.
          // Evita el bug de axios + FormData multipart en Android.
          const headers: Record<string, string> = {};
          if (token) headers['Authorization'] = `Bearer ${token}`;
          if (empresaId) headers['empresaId'] = empresaId;

          const uploadResult = await FileSystem.uploadAsync(`${API_URL}/Evidencia/SubirEvidencia`, archivo.uri, {
            httpMethod: 'POST',
            uploadType: FileSystem.FileSystemUploadType.MULTIPART,
            fieldName: 'archivo',
            mimeType,
            parameters: { registroServicioId: registro.id.toString() },
            headers,
          });

          if (uploadResult.status < 200 || uploadResult.status >= 300) {
            logger.error('Fallo al subir evidencia:', uploadResult.status, uploadResult.body);
            throw new Error(`Error ${uploadResult.status} al subir la evidencia`);
          }
        }
      }

      showSuccess('Evidencias subidas correctamente');
      setVisible(false);
      setArchivos([]);
      setRegistro(null);
      onSubidas();
    } catch (error) {
      logger.error('Error al subir evidencias:', error);
      showError('No se pudieron subir las evidencias');
    } finally {
      setSubiendo(false);
    }
  };

  return { ...seleccion, visible, registro, subiendo, abrir, cerrar, confirmar };
}
