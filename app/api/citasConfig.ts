/**
 * Configuración del módulo de Citas.
 *
 * El backend de Citas es un API distinto al de Natural. Cambia esta URL por
 * la dirección donde tengas desplegado el backend de Citas. Por defecto apunta
 * al entorno local de desarrollo (https://localhost:7006).
 *
 * NOTA: los endpoints NO llevan prefijo /api (rutas: /Auth/token, /Citas, etc.).
 */
import { Platform } from 'react-native';

const PROD_CITAS_URL = 'https://citas-production-8755.up.railway.app';

/**
 * Para desarrollo web (Expo/Metro) usamos un proxy local que evita problemas
 * de CORS si el backend no devuelve `Access-Control-Allow-Origin`.
 * Levanta el proxy con `npm run start:citas-proxy` y este fichero usará
 * `http://localhost:3001` cuando corras la app en web en modo desarrollo.
 */
export const CITAS_API_URL =
  Platform.OS === 'web' && typeof __DEV__ !== 'undefined' && __DEV__
    ? 'http://localhost:3001'
    : PROD_CITAS_URL;

/** Claves de AsyncStorage propias del módulo de Citas (no colisionan con Natural). */
export const CITAS_KEYS = {
  token: 'citas_token',
  tenant: 'citas_tenant',
  empresaNombre: 'citas_empresaNombre',
  usuario: 'citas_usuario',
  mode: 'citas_mode',
  userId: 'citas_userId',
} as const;
