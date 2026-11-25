import type { Cita, FranjaHorario, ServicioCitas } from '@/app/api/modelos/citas';
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

// ---- Fechas en hora local del negocio (America/Bogota, UTC-5 sin horario de verano) ----
// No se usa la zona del dispositivo: el backend habla siempre en hora local del negocio.

const OFFSET_NEGOCIO_MINUTOS = -5 * 60;

/** "YYYY-MM-DD" de hoy en la zona del negocio. */
export function hoyNegocio(): string {
  const d = new Date(Date.now() + OFFSET_NEGOCIO_MINUTOS * 60000);
  return d.toISOString().slice(0, 10);
}

/** Suma días a una fecha "YYYY-MM-DD" (aritmética de calendario, sin zona horaria). */
export function sumarDias(fecha: string, dias: number): string {
  const [y, m, d] = fecha.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + dias)).toISOString().slice(0, 10);
}

/** Día de la semana (0 = domingo) de una fecha "YYYY-MM-DD". */
export function diaSemana(fecha: string): number {
  const [y, m, d] = fecha.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

export const NOMBRES_DIA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const NOMBRES_MES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

/** "YYYY-MM-DD" -> "Lun 20 oct". */
export function etiquetaDia(fecha: string): string {
  const [, m, d] = fecha.split('-').map(Number);
  return `${NOMBRES_DIA[diaSemana(fecha)].slice(0, 3)} ${d} ${NOMBRES_MES[m - 1] ?? ''}`.trim();
}

/** "HH:mm:ss" + minutos -> "HH:mm" (sin pasar de medianoche). */
export function sumarMinutosHora(hora: string, minutos: number): string {
  const [h, m] = hora.split(':').map(Number);
  const total = Math.min(h * 60 + m + (minutos || 0), 24 * 60 - 1);
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

/** "2026-10-20T09:00:00-05:00" -> { fecha: "2026-10-20", hora: "09:00" } tal cual lo envía el backend. */
export function partesIso(iso: string): { fecha: string; hora: string } {
  return { fecha: (iso ?? '').slice(0, 10), hora: (iso ?? '').slice(11, 16) };
}

/** "HH:mm:ss" -> minutos desde medianoche. */
function minutosDe(hora: string): number {
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + m;
}

/** Valida inicio < fin y que no haya solapes dentro del mismo día. Devuelve errores por día. */
export function validarFranjas(franjas: FranjaHorario[]): Record<number, string> {
  const errores: Record<number, string> = {};
  for (let dia = 0; dia < 7; dia++) {
    const delDia = franjas.filter((f) => f.dia === dia).sort((a, b) => minutosDe(a.horaInicio) - minutosDe(b.horaInicio));
    for (let i = 0; i < delDia.length; i++) {
      const f = delDia[i];
      if (minutosDe(f.horaInicio) >= minutosDe(f.horaFin)) {
        errores[dia] = `La franja ${formatHora(f.horaInicio)} - ${formatHora(f.horaFin)} debe terminar después de empezar.`;
        break;
      }
      const anterior = delDia[i - 1];
      if (anterior && minutosDe(f.horaInicio) < minutosDe(anterior.horaFin)) {
        errores[dia] = `Las franjas ${formatHora(anterior.horaInicio)} - ${formatHora(anterior.horaFin)} y ${formatHora(f.horaInicio)} - ${formatHora(f.horaFin)} se solapan.`;
        break;
      }
    }
  }
  return errores;
}

/**
 * Opciones de servicios para reprogramar: los agendables más los de la cita que ya no lo sean
 * (para que la cita conserve sus servicios aunque hayan dejado de ofrecerse).
 */
export function serviciosConLosDeLaCita(servicios: ServicioCitas[], cita: Cita): ServicioCitas[] {
  const faltantes: ServicioCitas[] = cita.servicios
    .filter((d) => !servicios.some((s) => s.idServicio === d.idServicio))
    .map((d) => ({
      idServicio: d.idServicio,
      servicioNaturalId: 0,
      nombreServicio: d.nombreServicio || `Servicio #${d.idServicio}`,
      valor: d.valorServicio,
      tiempoEstimado: d.tiempoEstimado,
      activo: true,
      disponibleEnNatural: true,
      agendable: false,
    }));
  return [...servicios, ...faltantes];
}

/** true si dos listas de ids tienen los mismos elementos. */
export function mismosIds(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false;
  const sa = [...a].sort((x, y) => x - y);
  const sb = [...b].sort((x, y) => x - y);
  return sa.every((v, i) => v === sb[i]);
}
