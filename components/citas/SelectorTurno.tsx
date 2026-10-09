import { mensajeErrorCitas, obtenerDiasDisponibles, obtenerDisponibilidad } from '@/app/api/citasApi';
import { COLORS, commonStyles, FONT_SIZE, FONT_WEIGHT, RADIUS, SPACING } from '@/constants/theme';
import { etiquetaDia, formatDuracion, formatHora, hoyNegocio, sumarDias, sumarMinutosHora } from '@/utils/citas';
import type { AxiosInstance } from 'axios';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

/** Turno elegido en hora local del negocio. */
export interface TurnoElegido {
  /** "YYYY-MM-DD". */
  fecha: string;
  /** "HH:mm:ss". */
  hora: string;
  /** Minutos (según el backend). */
  duracion: number;
}

interface SelectorTurnoProps {
  api: AxiosInstance;
  empleadoId: number | null;
  idServicios: number[];
  valor: TurnoElegido | null;
  onChange: (turno: TurnoElegido | null) => void;
  /** Cambiarlo fuerza recargar las horas del día elegido (p. ej. tras un 409). */
  recarga?: number;
}

const DIAS_POR_BLOQUE = 14;
const MAX_DIAS = 90;

/** "HH:mm:ss" + duración -> "09:00 - 09:45". */
export function rangoTurno(turno: TurnoElegido): string {
  return `${formatHora(turno.hora)} - ${sumarMinutosHora(turno.hora, turno.duracion)}`;
}

/**
 * Selector de turnos: días con disponibilidad (`/Disponibilidad/dias`, de 14 en 14) y, al
 * elegir uno, sus horas libres (`/Disponibilidad`). Recalcula si cambian empleado o servicios.
 */
export default function SelectorTurno({ api, empleadoId, idServicios, valor, onChange, recarga = 0 }: SelectorTurnoProps) {
  const [hasta, setHasta] = useState('');
  const [dias, setDias] = useState<string[] | null>(null);
  const [cargandoDias, setCargandoDias] = useState(false);
  const [errorDias, setErrorDias] = useState('');
  const [fecha, setFecha] = useState<string | null>(null);
  const [horas, setHoras] = useState<string[] | null>(null);
  const [duracion, setDuracion] = useState(0);
  const [cargandoHoras, setCargandoHoras] = useState(false);
  const [errorHoras, setErrorHoras] = useState('');

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const pedidoDias = useRef(0);
  const pedidoHoras = useRef(0);

  const clave = `${empleadoId ?? ''}|${[...idServicios].sort((a, b) => a - b).join(',')}`;
  const listo = empleadoId != null && idServicios.length > 0;

  const cargarDias = useCallback(
    async (desde: string, fin: string, anexar: boolean) => {
      if (empleadoId == null || idServicios.length === 0) return;
      const id = ++pedidoDias.current;
      setCargandoDias(true);
      setErrorDias('');
      try {
        const res = await obtenerDiasDisponibles(api, empleadoId, desde, fin, idServicios);
        if (id !== pedidoDias.current) return;
        setDias((prev) => (anexar && prev ? [...prev, ...res.dias] : res.dias));
        setHasta(fin);
      } catch (e) {
        if (id !== pedidoDias.current) return;
        setErrorDias(mensajeErrorCitas(e, 'No se pudieron consultar los días disponibles.'));
        if (!anexar) setDias([]);
      } finally {
        if (id === pedidoDias.current) setCargandoDias(false);
      }
    },
    // `clave` resume empleado + servicios.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [api, clave]
  );

  // Cambian empleado o servicios: se reinicia todo.
  useEffect(() => {
    setFecha(null);
    setHoras(null);
    setDias(null);
    setErrorDias('');
    onChangeRef.current(null);
    if (!listo) return;
    const hoy = hoyNegocio();
    cargarDias(hoy, sumarDias(hoy, DIAS_POR_BLOQUE - 1), false);
  }, [clave, listo, cargarDias]);

  const cargarHoras = useCallback(
    async (dia: string) => {
      if (empleadoId == null || idServicios.length === 0) return;
      const id = ++pedidoHoras.current;
      setCargandoHoras(true);
      setErrorHoras('');
      setHoras(null);
      try {
        const res = await obtenerDisponibilidad(api, empleadoId, dia, idServicios);
        if (id !== pedidoHoras.current) return;
        setHoras(res.horas);
        setDuracion(res.duracionTotal);
      } catch (e) {
        if (id !== pedidoHoras.current) return;
        setErrorHoras(mensajeErrorCitas(e, 'No se pudieron consultar las horas disponibles.'));
        setHoras([]);
      } finally {
        if (id === pedidoHoras.current) setCargandoHoras(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [api, clave]
  );

  // Recarga externa (409): se vuelven a pedir las horas del día y se descarta la hora elegida.
  useEffect(() => {
    if (recarga === 0 || !fecha) return;
    onChangeRef.current(null);
    cargarHoras(fecha);
  }, [recarga]); // eslint-disable-line react-hooks/exhaustive-deps

  const elegirDia = (dia: string) => {
    setFecha(dia);
    onChangeRef.current(null);
    cargarHoras(dia);
  };

  const verMas = () => {
    const desde = sumarDias(hasta, 1);
    cargarDias(desde, sumarDias(hasta, DIAS_POR_BLOQUE), true);
  };
  const puedeVerMas = hasta !== '' && sumarDias(hoyNegocio(), MAX_DIAS) > hasta;

  if (!listo) {
    return <Text style={styles.ayuda}>Elige los servicios y quién atiende para ver los turnos disponibles.</Text>;
  }

  return (
    <View>
      <Text style={styles.subtitulo}>Día</Text>
      {dias === null && cargandoDias ? (
        <Cargando texto="Buscando días disponibles..." />
      ) : (
        <>
          {dias && dias.length > 0 ? (
            <View style={styles.chips}>
              {dias.map((d) => (
                <Chip key={d} texto={etiquetaDia(d)} activo={fecha === d} onPress={() => elegirDia(d)} />
              ))}
            </View>
          ) : !errorDias ? (
            <Text style={styles.ayuda}>No hay turnos disponibles en estos días.</Text>
          ) : null}
          {errorDias ? <Text style={styles.error}>{errorDias}</Text> : null}
          {cargandoDias ? (
            <Cargando texto="Cargando más días..." />
          ) : puedeVerMas ? (
            <Pressable onPress={verMas} style={styles.verMas}>
              <Text style={styles.enlace}>Ver más días</Text>
            </Pressable>
          ) : null}
        </>
      )}

      {fecha && (
        <>
          <Text style={[styles.subtitulo, { marginTop: SPACING.md }]}>Hora · {etiquetaDia(fecha)}</Text>
          {cargandoHoras || horas === null ? (
            <Cargando texto="Buscando horas libres..." />
          ) : errorHoras ? (
            <>
              <Text style={styles.error}>{errorHoras}</Text>
              <Pressable onPress={() => cargarHoras(fecha)} style={styles.verMas}>
                <Text style={styles.enlace}>Reintentar</Text>
              </Pressable>
            </>
          ) : horas.length === 0 ? (
            <Text style={styles.ayuda}>Ya no quedan horas libres este día. Elige otro.</Text>
          ) : (
            <View style={styles.chips}>
              {horas.map((h) => (
                <Chip
                  key={h}
                  texto={formatHora(h)}
                  activo={valor?.fecha === fecha && valor.hora === h}
                  onPress={() => onChangeRef.current({ fecha, hora: h, duracion })}
                />
              ))}
            </View>
          )}
        </>
      )}

      {valor && (
        <View style={styles.resumen}>
          <Text style={styles.resumenTitulo}>Turno elegido</Text>
          <Text style={styles.resumenTexto}>
            {etiquetaDia(valor.fecha)} · {rangoTurno(valor)} ({formatDuracion(valor.duracion)})
          </Text>
        </View>
      )}
    </View>
  );
}

function Chip({ texto, activo, onPress }: { texto: string; activo: boolean; onPress: () => void }) {
  return (
    <Pressable style={[commonStyles.chip, activo && commonStyles.chipActive]} onPress={onPress}>
      <Text style={[commonStyles.chipText, activo && commonStyles.chipTextActive]}>{texto}</Text>
    </Pressable>
  );
}

function Cargando({ texto }: { texto: string }) {
  return (
    <View style={styles.cargando}>
      <ActivityIndicator size="small" color={COLORS.primary} />
      <Text style={styles.ayuda}>{texto}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  subtitulo: { fontSize: FONT_SIZE.subhead, fontWeight: FONT_WEIGHT.semibold, color: COLORS.textSecondary, marginBottom: SPACING.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  ayuda: { fontSize: FONT_SIZE.subhead, color: COLORS.textSecondary },
  error: { fontSize: FONT_SIZE.subhead, color: COLORS.error, marginTop: SPACING.xs },
  enlace: { fontSize: FONT_SIZE.subhead, color: COLORS.primary, fontWeight: FONT_WEIGHT.semibold },
  verMas: { paddingVertical: SPACING.sm, alignSelf: 'flex-start' },
  cargando: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, paddingVertical: SPACING.sm },
  resumen: {
    marginTop: SPACING.md,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primarySurface,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
  },
  resumenTitulo: { fontSize: FONT_SIZE.footnote, color: COLORS.primaryDark, fontWeight: FONT_WEIGHT.semibold },
  resumenTexto: { fontSize: FONT_SIZE.body, color: COLORS.text, fontWeight: FONT_WEIGHT.medium, marginTop: SPACING.xxs },
});
