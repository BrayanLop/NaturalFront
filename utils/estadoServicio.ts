import { RegistroServicio } from '@/app/api/modelos/registroServicio';

export type EstadoServicio = 'pendiente' | 'aprobado' | 'rechazado' | 'liquidado';

/**
 * Deriva el estado de un registro de servicio a partir de sus flags.
 * Orden de prioridad: liquidado > rechazado > aprobado > pendiente.
 * Es compatible con registros antiguos que solo tienen confirmado/liquidado.
 */
export function estadoServicio(
  registro: Pick<RegistroServicio, 'confirmado' | 'liquidado' | 'rechazado'>
): EstadoServicio {
  if (registro.liquidado) return 'liquidado';
  if (registro.rechazado) return 'rechazado';
  if (registro.confirmado) return 'aprobado';
  return 'pendiente';
}

export const ESTADO_LABEL: Record<EstadoServicio, string> = {
  pendiente: 'Pendiente',
  aprobado: 'Aprobado',
  rechazado: 'Rechazado',
  liquidado: 'Liquidado',
};
