import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { logger } from './logger';

/**
 * Puente mínimo entre la capa HTTP (`app/api/api.ts`) y `AuthContext`.
 *
 * El interceptor de axios no puede importar el contexto de React (dependencia circular
 * y fuera del árbol de componentes), así que `AuthContext` registra aquí su `logout`
 * y el interceptor solo avisa con `notificarSesionExpirada()`.
 */

/** Claves de AsyncStorage que componen la sesión. Fuente única para login/logout. */
export const SESSION_STORAGE_KEYS = [
  'usuario',
  'empresaId',
  'rol',
  'personaId',
  'token',
  'isDemo',
] as const;

type SesionExpiradaHandler = () => Promise<void> | void;

let handler: SesionExpiradaHandler | null = null;
// Evita disparar varios logout cuando fallan en paralelo varias peticiones con 401.
let cierreEnCurso: Promise<void> | null = null;

export async function limpiarSesionStorage(): Promise<void> {
  await AsyncStorage.multiRemove([...SESSION_STORAGE_KEYS]);
}

/** Registra quién cierra la sesión ante un 401. Devuelve la función para desregistrar. */
export function registrarHandlerSesionExpirada(nuevoHandler: SesionExpiradaHandler): () => void {
  handler = nuevoHandler;
  return () => {
    if (handler === nuevoHandler) handler = null;
  };
}

/**
 * Cierra la sesión porque el backend rechazó el token.
 * Si `AuthContext` está montado, usa su `logout` (limpia también el estado de React);
 * si no, limpia el storage y navega a /login directamente.
 */
export function notificarSesionExpirada(): Promise<void> {
  if (cierreEnCurso) return cierreEnCurso;

  cierreEnCurso = (async () => {
    try {
      if (handler) {
        await handler();
      } else {
        await limpiarSesionStorage();
        router.replace('/login');
      }
    } catch (e) {
      logger.error('[Sesión] Error cerrando la sesión expirada', e);
    } finally {
      cierreEnCurso = null;
    }
  })();

  return cierreEnCurso;
}
