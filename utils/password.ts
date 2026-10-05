import * as Crypto from 'expo-crypto';

/**
 * Calcula el hash que el backend espera para una contraseña:
 * SHA-256 sobre los bytes UTF-8 del texto plano, codificado en Base64 (44 caracteres).
 *
 * ⚠️ No cambiar el algoritmo ni la codificación: el backend compara contra este
 * string exacto (login y cambio de contraseña). Nunca loguear el resultado.
 */
export async function hashPassword(plain: string): Promise<string> {
  const passwordBytes = new TextEncoder().encode(plain);
  const hashBytes = await Crypto.digest(Crypto.CryptoDigestAlgorithm.SHA256, passwordBytes);
  // SHA-256 son siempre 32 bytes, así que el spread a fromCharCode es seguro (sin riesgo de stack).
  return btoa(String.fromCharCode(...new Uint8Array(hashBytes)));
}
