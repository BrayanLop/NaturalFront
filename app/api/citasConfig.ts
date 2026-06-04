/**
 * Configuración del módulo de Citas.
 *
 * El backend de Citas es un API distinto al de Natural. Cambia esta URL por
 * la dirección donde tengas desplegado el backend de Citas. Por defecto apunta
 * al entorno local de desarrollo (https://localhost:7006).
 *
 * NOTA: los endpoints NO llevan prefijo /api (rutas: /Auth/token, /Citas, etc.).
 */
export const CITAS_API_URL = 'https://localhost:7006';

/** Claves de AsyncStorage propias del módulo de Citas (no colisionan con Natural). */
export const CITAS_KEYS = {
  token: 'citas_token',
  tenant: 'citas_tenant',
  empresaNombre: 'citas_empresaNombre',
  usuario: 'citas_usuario',
  mode: 'citas_mode',
  userId: 'citas_userId',
} as const;
