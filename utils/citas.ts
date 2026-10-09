import type { Cita, ServicioCitas } from '@/app/api/modelos/citas';
import { formatDate } from './formatters';

/** Tipo de StatusBadge para cada estado de cita. */
export function badgeEstadoCita(estado: string): 'pendiente' | 'confirmado' | 'liquidado' | 'rechazado' | 'info' {
  switch (estado) {
    case 'Pendiente':
      return 'pendiente';
    case 'Confirmada':
      return 'confirmado';
    case 'Atendida':
      return 'liquidado';
    case 'Cancelada':
      return 'rechazado';
    default:
      return 'info';
  }
}

/** Texto del botón que lleva una cita a cada estado. */
export const ACCION_ESTADO: Record<string, string> = {
  Confirmada: 'Confirmar',
  Atendida: 'Marcar como atendida',
  Cancelada: 'Cancelar cita',
};

/** "HH:mm:ss" -> "HH:mm". */
export function formatHora(hora?: string | null): string {
  if (!hora) return '';
  return hora.slice(0, 5);
}

/** Parte de fecha ("YYYY-MM-DD") de un DateTime del backend. */
export function fechaDeCita(cita: Pick<Cita, 'fechaCita'>): string {
  return (cita.fechaCita ?? '').split('T')[0];
}

export function formatFechaHoraCita(cita: Cita): string {
  const fin = cita.horaEstimadaFin ? ` - ${formatHora(cita.horaEstimadaFin)}` : '';
  return `${formatDate(fechaDeCita(cita))} · ${formatHora(cita.horaEstimadaCita)}${fin}`;
}

/** Minutos -> "1 h 30 min". */
export function formatDuracion(minutos: number): string {
  if (!minutos || minutos <= 0) return '0 min';
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  if (h && m) return `${h} h ${m} min`;
  return h ? `${h} h` : `${m} min`;
}

/** Valida "H:mm" o "HH:mm" (24 h) y devuelve "HH:mm:00" o null. */
export function normalizarHora(texto: string): string | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(texto.trim());
  if (!match) return null;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (h > 23 || m > 59) return null;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;
}

/** Totales de los servicios elegidos (lo mismo que calcula el backend al agendar). */
export function totalesServicios(servicios: ServicioCitas[]): { duracion: number; valor: number } {
  return servicios.reduce(
    (acc, s) => ({ duracion: acc.duracion + (s.tiempoEstimado || 0), valor: acc.valor + (s.valor || 0) }),
    { duracion: 0, valor: 0 }
  );
}

/** Ordena por fecha y hora de inicio (más próximas primero). */
export function ordenarCitas(citas: Cita[]): Cita[] {
  return [...citas].sort((a, b) =>
    `${fechaDeCita(a)} ${a.horaEstimadaCita}`.localeCompare(`${fechaDeCita(b)} ${b.horaEstimadaCita}`)
  );
}
