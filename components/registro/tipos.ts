import type { EstadoServicio } from '@/utils/estadoServicio';
import type { TonoBadge } from '@/components/ds';

/** Archivo elegido para subir como evidencia (cámara, galería o documento). */
export interface ArchivoSeleccionado {
  uri: string;
  name: string;
  type: string;
  size?: number;
}

export type EstadoFiltro = 'todos' | 'liquidados' | 'confirmados' | 'noLiquidados' | 'noConfirmados' | 'rechazados';
export type FormaPagoFiltro = 'todos' | 'T' | 'E';
export type CampoFecha = 'inicio' | 'fin';

/** Servicios agrupados por persona para el bloque "Consolidado". */
export interface ConsolidadoPersona {
  nombrePersona: string;
  servicios: { nombreServicio: string; cantidad: number }[];
}

/** Tono del `Badge` según el estado del registro. */
export const TONO_ESTADO: Record<EstadoServicio, TonoBadge> = {
  pendiente: 'warning',
  aprobado: 'success',
  rechazado: 'error',
  liquidado: 'info',
};
