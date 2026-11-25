/**
 * Configuración del módulo de Citas (backend distinto al de Natural).
 *
 * La URL sale de `EXPO_PUBLIC_CITAS_API_URL` (ver `.env.example`). Si no está definida,
 * el módulo queda deshabilitado y las pantallas muestran un aviso en lugar de fallar.
 * Los endpoints de Citas NO llevan prefijo /api (p. ej. `/Citas`, `/Auth/login`).
 */
const urlEntorno = (process.env.EXPO_PUBLIC_CITAS_API_URL ?? '').trim();

/** URL base del API de Citas, sin barra final. Cadena vacía si no está configurada. */
export const CITAS_API_URL = urlEntorno.replace(/\/+$/, '');

/** true si el módulo de Citas tiene URL configurada. */
export const citasConfigurado = CITAS_API_URL.length > 0;

export const MENSAJE_CITAS_NO_CONFIGURADO =
  'El módulo de citas no está configurado en esta versión de la app (falta EXPO_PUBLIC_CITAS_API_URL).';

/**
 * Claves de AsyncStorage de la sesión de CLIENTE de Citas. Prefijo `citas_` para no
 * colisionar con la sesión de Natural (el personal usa el token de Natural, no estas claves).
 */
export const CITAS_KEYS = {
  /** Token que se envía en las peticiones (el de empresa si ya eligió una, si no el de login). */
  token: 'citas_token',
  /** Token de login (sin empresa); permite cambiar de empresa sin volver a iniciar sesión. */
  tokenLogin: 'citas_token_login',
  expiraUtc: 'citas_expira_utc',
  personaId: 'citas_persona_id',
  nombre: 'citas_nombre',
  tenant: 'citas_tenant',
  empresaNombre: 'citas_empresa_nombre',
  userId: 'citas_user_id',
} as const;

export const CITAS_STORAGE_KEYS = Object.values(CITAS_KEYS);
