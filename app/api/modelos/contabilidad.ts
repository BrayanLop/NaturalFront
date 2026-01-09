export interface Contabilidad {
  personaId: number;
  nombrePersona: string;
  cantidadServicios: number;
  montoTotal: number;
  fechaLiquidacion?: string;
  liquidado: boolean;
}

export interface HistorialLiquidacion {
  personaId: number;
  nombrePersona: string;
  fechaLiquidacion: string;
  totalPagado: number;
}

export interface DetalleServicioPersona {
  id: number;
  personaId: number;
  servicioId: number;
  nombreServicio: string;
  precio: number;
  fechaServicio: string;
  confirmado: boolean;
  liquidado: boolean;
  porcentajeTrabajador: number;
  ganancia: number;
}
