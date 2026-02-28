export interface RegistroServicio {
  id: number;
  personaId: number;
  servicioId: number;
  nombrePersona: string;
  nombreServicio: string;
  fechaServicio: string;
  confirmado: boolean;
  liquidado: boolean;
  empresaId?: number;
  formaPago?: string;
  evidencias?: Evidencia[];
}

export interface Evidencia {
  id: number;
  registroServicioId: number;
  urlEvidencia: string;
  nombreArchivo: string;
  fechaSubida: string;
}

export interface RegistroServicioCreate {
  personaId: number;
  servicioId: number;
  fechaServicio: string;
  FormaPago?: string;
}

export interface ConsolidadoPersona {
  nombrePersona: string;
  cantidadServicios: number;
}
