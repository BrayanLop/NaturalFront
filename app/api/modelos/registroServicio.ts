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
}

export interface RegistroServicioCreate {
  personaId: number;
  servicioId: number;
  fechaServicio: string;
}

export interface ConsolidadoPersona {
  nombrePersona: string;
  cantidadServicios: number;
}
