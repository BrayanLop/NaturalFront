export interface EmpresaPlataforma {
  id: number;
  nombre: string | null;
  nit?: string | null;
  direccion?: string | null;
  telefono?: string | null;
  activa: boolean;
  totalPersonas: number;
  totalAccesos: number;
  accesosActivos: number;
}

export interface AdminEmpresaRequest {
  nombre: string;
  apellido: string;
  cedula: string;
  email: string;
  celular: string;
  nombreUsuario: string;
  /** SHA-256 en base64 (usar hashPassword). */
  contrasena: string;
}

export interface CrearEmpresaRequest {
  nombre: string;
  nit?: string;
  direccion?: string;
  telefono?: string;
  admin: AdminEmpresaRequest;
}

export interface AuditoriaItem {
  id: number;
  fechaUtc: string;
  actorPersonaId: number;
  actorNombre: string;
  accion: string;
  empresaId?: number | null;
  usuarioId?: number | null;
  resultado: 'pendiente' | 'ok' | 'error';
  detalle?: string | null;
  ip?: string | null;
}

export interface PaginaAuditoria {
  total: number;
  pagina: number;
  tamano: number;
  items: AuditoriaItem[];
}

/** Respuesta de POST /Empresas/{id}/Impersonar. */
export interface Impersonacion {
  token: string;
  expiraEn: string;
  persona: {
    id: number;
    idUsuario: number;
    nombre: string;
    empresaId: number;
    nombreEmpresa?: string | null;
    rol: string;
  };
}
