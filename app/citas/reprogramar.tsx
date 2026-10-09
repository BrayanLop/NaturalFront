import { citasClienteApi, mensajeErrorCitas, mostrarErrorEnvioCita, reprogramarCita } from '@/app/api/citasApi';
import type { Cita, CrearCitaRequest, ReprogramarCitaRequest, ServicioCitas, UsuarioCitas } from '@/app/api/modelos/citas';
import FormularioCita, { type ResultadoEnvioCita } from '@/components/citas/FormularioCita';
import EmptyState from '@/components/EmptyState';
import LoadingView from '@/components/LoadingView';
import { COLORS, FONT_SIZE, SPACING } from '@/constants/theme';
import { formatFechaHoraCita, serviciosConLosDeLaCita } from '@/utils/citas';
import { showSuccess } from '@/utils/logger';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface Datos {
  cita: Cita | null;
  servicios: ServicioCitas[];
  empleados: UsuarioCitas[];
}

/** El cliente cambia el día/hora de una de sus citas Pendiente (mismos servicios y empleado). */
export default function ReprogramarCitaCliente() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [datos, setDatos] = useState<Datos | null>(null);
  const [error, setError] = useState('');

  const cargar = useCallback(async () => {
    try {
      const [c, s, u] = await Promise.all([
        citasClienteApi.get<Cita[]>('/Citas'),
        citasClienteApi.get<ServicioCitas[]>('/Servicios'),
        citasClienteApi.get<UsuarioCitas[]>('/Usuarios'),
      ]);
      setDatos({
        cita: (c.data ?? []).find((x) => String(x.idCita) === String(id)) ?? null,
        servicios: s.data ?? [],
        empleados: u.data ?? [],
      });
      setError('');
    } catch (e) {
      setDatos({ cita: null, servicios: [], empleados: [] });
      setError(mensajeErrorCitas(e, 'No se pudo cargar la cita.'));
    }
  }, [id]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  if (datos === null) return <LoadingView message="Cargando..." fullScreen />;
  if (error) return <EmptyState icon="⚠️" message="No se pudo cargar" subtitle={error} actionLabel="Reintentar" onAction={cargar} />;
  const { cita } = datos;
  if (!cita) return <EmptyState icon="🔍" message="Cita no encontrada" />;
  if (cita.estado !== 'Pendiente') {
    return (
      <EmptyState
        icon="🗓️"
        message="Solo puedes reprogramar citas pendientes"
        subtitle="Si necesitas otro cambio, comunícate con el negocio."
      />
    );
  }

  const empleados: UsuarioCitas[] = datos.empleados.some((e) => e.id === cita.idEmpleado)
    ? datos.empleados
    : [...datos.empleados, { id: cita.idEmpleado, nombreUsuario: cita.nombreEmpleado || 'Personal', activo: true }];

  const guardar = async (d: CrearCitaRequest): Promise<ResultadoEnvioCita> => {
    const cambios: ReprogramarCitaRequest = { fechaCita: d.fechaCita, horaEstimadaCita: d.horaEstimadaCita };
    if ((d.observaciones ?? '') !== (cita.observaciones ?? '')) cambios.observaciones = d.observaciones;
    try {
      await reprogramarCita(citasClienteApi, cita.idCita, cambios);
      showSuccess('Tu cita fue reprogramada.');
      router.back();
      return 'ok';
    } catch (e) {
      return mostrarErrorEnvioCita(e, 'No se pudo reprogramar la cita.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.actual}>Fecha actual: {formatFechaHoraCita(cita)}</Text>
      <FormularioCita
        api={citasClienteApi}
        servicios={serviciosConLosDeLaCita(datos.servicios, cita)}
        empleados={empleados}
        inicial={{
          idEmpleado: cita.idEmpleado,
          idServicios: cita.servicios.map((s) => s.idServicio),
          observaciones: cita.observaciones,
        }}
        bloquearServiciosEmpleado
        textoBoton="Reprogramar cita"
        onSubmit={guardar}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  actual: { fontSize: FONT_SIZE.subhead, color: COLORS.textSecondary, paddingHorizontal: SPACING.lg, paddingTop: SPACING.lg },
});
