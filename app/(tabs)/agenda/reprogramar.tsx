import { citasPersonalApi, mensajeErrorCitas, mostrarErrorEnvioCita, reprogramarCita } from '@/app/api/citasApi';
import type { CrearCitaRequest, ReprogramarCitaRequest, ServicioCitas } from '@/app/api/modelos/citas';
import FormularioCita, { type ResultadoEnvioCita } from '@/components/citas/FormularioCita';
import EmptyState from '@/components/EmptyState';
import LoadingView from '@/components/LoadingView';
import { COLORS, FONT_SIZE, SPACING } from '@/constants/theme';
import { useAgendaPersonal } from '@/hooks/useAgendaPersonal';
import { useRole } from '@/hooks/useRole';
import { formatFechaHoraCita, mismosIds, serviciosConLosDeLaCita } from '@/utils/citas';
import { showSuccess } from '@/utils/logger';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

/** Reprogramar una cita activa (solo 01/03): turno y, si se quiere, empleado y servicios. */
export default function ReprogramarCitaPersonal() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { isAdmin } = useRole();
  const agenda = useAgendaPersonal();
  const [servicios, setServicios] = useState<ServicioCitas[] | null>(null);
  const [errorServicios, setErrorServicios] = useState('');

  const cargarServicios = useCallback(() => {
    citasPersonalApi
      .get<ServicioCitas[]>('/Servicios')
      .then(({ data }) => {
        setServicios((data ?? []).filter((s) => s.agendable));
        setErrorServicios('');
      })
      .catch((e) => {
        setServicios([]);
        setErrorServicios(mensajeErrorCitas(e, 'No se pudieron cargar los servicios.'));
      });
  }, []);

  useFocusEffect(cargarServicios);

  if (!isAdmin) return <EmptyState icon="🔒" message="Solo un administrador puede reprogramar citas." />;
  if (agenda.estado === 'cargando' || servicios === null) return <LoadingView message="Cargando..." fullScreen />;
  if (agenda.estado !== 'ok' || errorServicios) {
    return (
      <EmptyState
        icon="⚠️"
        message="No se pudo cargar la información"
        subtitle={agenda.error || errorServicios}
        actionLabel="Reintentar"
        onAction={() => {
          agenda.cargar();
          cargarServicios();
        }}
      />
    );
  }

  const cita = agenda.citas.find((c) => String(c.idCita) === String(id));
  if (!cita) return <EmptyState icon="🔍" message="Cita no encontrada" />;
  if (cita.estado !== 'Pendiente' && cita.estado !== 'Confirmada') {
    return <EmptyState icon="🗓️" message="Esta cita ya no se puede reprogramar" subtitle={`Estado: ${cita.estado}`} />;
  }

  const idServiciosCita = cita.servicios.map((s) => s.idServicio);

  const guardar = async (datos: CrearCitaRequest): Promise<ResultadoEnvioCita> => {
    // Además del turno, solo se envía lo que cambió (lo omitido se conserva).
    const cambios: ReprogramarCitaRequest = { fechaCita: datos.fechaCita, horaEstimadaCita: datos.horaEstimadaCita };
    if (datos.idEmpleado !== cita.idEmpleado) cambios.idEmpleado = datos.idEmpleado;
    if (!mismosIds(datos.idServicios, idServiciosCita)) cambios.idServicios = datos.idServicios;
    if ((datos.observaciones ?? '') !== (cita.observaciones ?? '')) cambios.observaciones = datos.observaciones;
    try {
      await reprogramarCita(citasPersonalApi, cita.idCita, cambios);
      showSuccess('Cita reprogramada.');
      router.back();
      return 'ok';
    } catch (e) {
      return mostrarErrorEnvioCita(e, 'No se pudo reprogramar la cita.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.actual}>
        Cita #{cita.idCita} de {cita.nombreCliente || 'cliente'} · Actual: {formatFechaHoraCita(cita)}
      </Text>
      <FormularioCita
        api={citasPersonalApi}
        servicios={serviciosConLosDeLaCita(servicios, cita)}
        empleados={agenda.empleados.filter((e) => e.activo)}
        inicial={{ idEmpleado: cita.idEmpleado, idServicios: idServiciosCita, observaciones: cita.observaciones }}
        textoBoton="Reprogramar cita"
        onSubmit={guardar}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  actual: { fontSize: FONT_SIZE.subhead, color: COLORS.textSecondary, paddingHorizontal: SPACING.lg, paddingTop: SPACING.lg },
});
