// Una persona de la empresa y, si lo tiene, su acceso (usuario) a la aplicación.
export interface Acceso {
  personaId: number;
  nombre: string;
  apellido: string;
  email?: string | null;
  usuarioId?: number | null;
  nombreUsuario?: string | null;
  tieneAcceso: boolean;
  activo: boolean;
  rol?: string | null;
}

export interface CrearAccesoRequest {
  personaId: number;
  nombreUsuario: string;
  /** SHA-256 en base64 (usar hashPassword). */
  contrasena: string;
  rol: string;
}
