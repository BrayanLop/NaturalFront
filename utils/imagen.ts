import { logger } from '@/utils/logger';
import * as ImageManipulator from 'expo-image-manipulator';

const MAX_ANCHO = 1280;
const CALIDAD = 0.7;

/**
 * Redimensiona y comprime una imagen antes de subirla.
 *
 * Las fotos de galería vienen a resolución completa (varios MB) y el proxy
 * nginx que está delante de la API las rechaza (límite por defecto 1MB).
 * Comprimirlas aquí evita ese rechazo, acelera la subida y reduce el riesgo
 * de cortes de conexión en subidas largas.
 *
 * Si la compresión falla por cualquier motivo, devuelve la uri original
 * para no bloquear la subida.
 *
 * @param uri  uri de la imagen (file://, content://, ph:// o blob:)
 * @param anchoOriginal  ancho en px si se conoce (asset.width); evita reescalar imágenes ya pequeñas
 */
export async function comprimirImagen(uri: string, anchoOriginal?: number): Promise<string> {
  try {
    const acciones =
      !anchoOriginal || anchoOriginal > MAX_ANCHO
        ? [{ resize: { width: MAX_ANCHO } }]
        : [];

    const resultado = await ImageManipulator.manipulateAsync(uri, acciones, {
      compress: CALIDAD,
      format: ImageManipulator.SaveFormat.JPEG,
    });

    return resultado.uri;
  } catch (error) {
    logger.warn('[comprimirImagen] No se pudo comprimir, se usa la original', error);
    return uri;
  }
}
