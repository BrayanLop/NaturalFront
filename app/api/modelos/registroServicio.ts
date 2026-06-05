export interface RegistroServicio {
  id: number;
  personaId: number;
  servicioId: number;
  nombrePersona: string;
  nombreServicio: string;
  fechaServicio: string;
  confirmado: boolean;
  liquidado: boolean;
  /** Servicio rechazado por el administrador. Excluyente con confirmado. */
  rechazado?: boolean;
  /** Motivo del rechazo (cuando rechazado = true). */
  motivoRechazo?: string;
  /** Propina recibida por el trabajador. Pertenece 100% al trabajador. */
  propina?: number;
  /** True si la propina ya fue entregada al trabajador (en mano o en liquidación). */
  propinaPagada?: boolean;
  /** Fecha en que se marcó la propina como entregada. */
  fechaPropinaPagada?: string;
  /** Observaciones registradas por el trabajador al crear el servicio. */
  observaciones?: string;
  // --- Snapshot histórico inmutable (capturado al registrar el servicio) ---
  /** Valor del servicio al momento del registro. No cambia si el servicio se edita después. */
  valorServicio?: number;
  /** Porcentaje del trabajador aplicado al momento del registro. */
  porcentajeTrabajador?: number;
  /** Comisión generada para el trabajador al momento del registro (valorServicio * porcentaje / 100). */
  comision?: number;
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
  /** Propina recibida (100% del trabajador). */
  propina?: number;
  /** Observaciones del trabajador. */
  observaciones?: string;
}

export interface ConsolidadoPersona {
  nombrePersona: string;
  cantidadServicios: number;
}
