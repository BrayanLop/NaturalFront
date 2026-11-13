/**
 * Texto de error para mostrar al usuario. El API responde los errores de negocio como string simple
 * (p. ej. BadRequest("No puedes desactivar tu propio acceso.")); si no hay, se usa el mensaje por defecto.
 */
export function mensajeDeError(error: any, porDefecto: string): string {
  const data = error?.response?.data;
  if (typeof data === 'string' && data.trim().length > 0) return data;
  if (typeof data?.message === 'string' && data.message.length > 0) return data.message;
  if (typeof data?.title === 'string' && data.title.length > 0) return data.title;
  return porDefecto;
}
