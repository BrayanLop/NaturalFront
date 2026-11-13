import { comprimirImagen } from '@/utils/imagen';
import { logger } from '@/utils/logger';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import { useCallback, useState } from 'react';
import { Alert, Platform } from 'react-native';
import type { ArchivoSeleccionado } from './tipos';

/**
 * Selección de evidencias (cámara, galería o archivo) con compresión de imágenes.
 * Misma lógica que tenían por separado la lista de registros y el resumen del registro.
 */
export function useSeleccionArchivos() {
  const [archivos, setArchivos] = useState<ArchivoSeleccionado[]>([]);

  const agregar = useCallback((archivo: ArchivoSeleccionado) => {
    setArchivos((prev) => [...prev, archivo]);
  }, []);

  const tomarFoto = useCallback(async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso requerido', 'Necesitamos permisos para usar la cámara');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const uriComprimida = await comprimirImagen(asset.uri, asset.width);
        const archivo: ArchivoSeleccionado = {
          uri: uriComprimida,
          name: `foto_${Date.now()}.jpg`,
          type: 'image/jpeg',
          size: asset.fileSize,
        };
        logger.log('Foto tomada:', archivo);
        agregar(archivo);
      }
    } catch (error) {
      logger.error('Error al tomar foto:', error);
      Alert.alert('Error', 'No se pudo tomar la foto');
    }
  }, [agregar]);

  const seleccionarImagen = useCallback(async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso requerido', 'Necesitamos permisos para acceder a tus fotos');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: false,
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        let finalUri = asset.uri;

        // En Android (content://) e iOS (ph://), copiar a cache para que funcione con FormData
        if (Platform.OS !== 'web' && (asset.uri.startsWith('content://') || asset.uri.startsWith('ph://'))) {
          const fileName = asset.fileName || `imagen_${Date.now()}.jpg`;
          const cacheUri = `${FileSystem.cacheDirectory}${fileName}`;
          try {
            await FileSystem.copyAsync({ from: asset.uri, to: cacheUri });
            finalUri = cacheUri;
            logger.log('Imagen copiada a cache:', cacheUri);
          } catch (copyError) {
            // Si falla la copia, se intenta con la URI original
            logger.error('Error al copiar imagen a cache:', copyError);
          }
        }

        // Redimensionar/comprimir para no exceder el límite del proxy (nginx 1MB)
        finalUri = await comprimirImagen(finalUri, asset.width);

        const archivo: ArchivoSeleccionado = {
          uri: finalUri,
          name: `imagen_${Date.now()}.jpg`,
          type: 'image/jpeg',
          size: asset.fileSize,
        };
        logger.log('Imagen seleccionada:', archivo);
        agregar(archivo);
      }
    } catch (error) {
      logger.error('Error al seleccionar imagen:', error);
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
    }
  }, [agregar]);

  const seleccionarDocumento = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const esImagen = (asset.mimeType || '').startsWith('image/');
        // Solo comprimir imágenes; los PDF u otros archivos van tal cual
        const uriFinal = esImagen ? await comprimirImagen(asset.uri) : asset.uri;
        const archivo: ArchivoSeleccionado = {
          uri: uriFinal,
          name: esImagen ? `imagen_${Date.now()}.jpg` : asset.name,
          type: esImagen ? 'image/jpeg' : asset.mimeType || 'application/octet-stream',
          size: asset.size,
        };
        logger.log('Documento seleccionado:', archivo);
        agregar(archivo);
      }
    } catch (error) {
      logger.error('Error al seleccionar documento:', error);
      Alert.alert('Error', 'No se pudo seleccionar el documento');
    }
  }, [agregar]);

  const eliminarArchivo = useCallback((index: number) => {
    setArchivos((prev) => prev.filter((_, i) => i !== index));
  }, []);

  return { archivos, setArchivos, tomarFoto, seleccionarImagen, seleccionarDocumento, eliminarArchivo };
}
