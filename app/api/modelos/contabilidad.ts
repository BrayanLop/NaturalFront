export interface Contabilidad {
  personaId: number;
  nombrePersona: string;
  cantidadServicios: number;
  montoTotal: number;
  fechaLiquidacion?: string;
  liquidado: boolean;
}

export interface HistorialLiquidacion {
  /** Puede venir null/ausente en liquidaciones antiguas o backs viejos. */
  idLiquidacion?: number | null;
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

/** Forma de pago: 'E' efectivo, 'T' transferencia. */
export type FormaPagoCodigo = 'E' | 'T';

export interface PagoLiquidacion {
  formaPago: FormaPagoCodigo;
  valor: number;
}

/** Vista previa de la liquidación (GET Contabilidad/ResumenLiquidacion/{personaId}). */
export interface ResumenLiquidacion {
  personaId: number;
  nombrePersona: string;
  fechaDesde: string | null;
  fechaHasta: string | null;
  cantidadServicios: number;
  totalFacturado: number;
  totalComision: number;
  totalDeducciones: number;
  netoAPagar: number;
}

export interface LiquidarPersonaRequest {
  pagos?: PagoLiquidacion[];
}

export interface LiquidarPersonaResponse {
  idLiquidacion: number | null;
}

export interface ComprobanteServicio {
  nombre: string;
  cantidad: number;
  valorFacturado: number;
  comision: number;
}

export interface ComprobanteDeduccion {
  fecha: string | null;
  motivo: string;
  valor: number;
  formaPago: FormaPagoCodigo | null;
}

/** Comprobante de una liquidación (GET Contabilidad/Comprobante/{idLiquidacion}). */
export interface ComprobanteLiquidacion {
  idLiquidacion: number;
  empresa: { nombre: string; nit: string | null };
  persona: { id: number; nombreCompleto: string; cedula: string | null };
  fechaLiquidacion: string;
  periodoDesde: string | null;
  periodoHasta: string | null;
  cantidadServicios: number;
  servicios: ComprobanteServicio[];
  totalFacturado: number;
  totalComision: number;
  deducciones: ComprobanteDeduccion[];
  totalDeducciones: number;
  netoPagado: number;
  pagos: PagoLiquidacion[];
  esReconstruido: boolean;
}

/** GET Contabilidad/ConsolidadoFormaPago. Los campos opcionales pueden no venir en backs antiguos. */
export interface ConsolidadoFormaPago {
  cantidadTransferencia: number;
  totalTransferencia: number;
  cantidadEfectivo: number;
  totalEfectivo: number;
  egresosPagadosEfectivo?: number;
  egresosPagadosTransferencia?: number;
  pagosLiquidacionesEfectivo?: number;
  pagosLiquidacionesTransferencia?: number;
  netoEfectivo?: number;
  netoTransferencia?: number;
}

/** GET Contabilidad/ConsolidadoIngresosEgresos. */
export interface ConsolidadoIngresosEgresos {
  totalIngresos: number;
  totalEgresos: number;
  consolidado: number;
  /** Informativo: egresos descontados en liquidaciones. Puede no venir en backs antiguos. */
  deduccionesRecuperadas?: number;
}
