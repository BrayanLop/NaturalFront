import { citasPersonalApi, mensajeErrorCitas } from '@/app/api/citasApi';
import { TRANSICIONES_CITA } from '@/app/api/modelos/citas';
import DetalleCitaView from '@/components/citas/DetalleCitaView';
import EmptyState from '@/components/EmptyState';
import LoadingView from '@/components/LoadingView';
import PrimaryButton from '@/components/PrimaryButton';
import { COLORS, FONT_SIZE, SPACING } from '@/constants/theme';
import { useAgendaPersonal } from '@/hooks/useAgendaPersonal';
import { useRole } from '@/hooks/useRole';
import { ACCION_ESTADO } from '@/utils/citas';
import { showConfirm, showError } from '@/utils/logger';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

/** Detalle de una cita para el personal, con cambio de estado (y borrado para 01/03). */
export default function DetalleCitaPersonal() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { isAdmin } = useRole();
  const agenda = useAgendaPersonal();
  const [guardando, setGuardando] = useState(false);

  if (agenda.estado === 'cargando') return <LoadingView message="Cargando cita..." fullScreen />;
  if (agenda.estado !== 'ok') {
    return <EmptyState icon="⚠️" message="No se pudo cargar la cita" subtitle={agenda.error} actionLabel="Reintentar" onAction={agenda.cargar} />;
  }

  // El backend no expone GET /Citas/{id}: se busca en la agenda del tenant.
  const cita = agenda.citas.find((c) => String(c.idCita) === String(id));
  if (!cita) return <EmptyState icon="🔍" message="Cita no encontrada" />;

  // 01/03 cambian cualquier cita; 02 solo las que atiende (el backend lo vuelve a validar).
  const puedeCambiar = isAdmin || (agenda.miUsuarioId != null && cita.idEmpleado === agenda.miUsuarioId);
  const siguientes = TRANSICIONES_CITA[cita.estado] ?? [];

  const cambiarEstado = async (nuevo: string) => {
    if (!(await showConfirm(`¿Cambiar la cita a “${nuevo}”?`))) return;
    setGuardando(true);
    try {
      await citasPersonalApi.patch(`/Citas/${cita.idCita}`, { estado: nuevo });
      await agenda.cargar();
    } catch (e) {
      showError(mensajeErrorCitas(e, 'No se pudo cambiar el estado.'));
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = async () => {
    if (!(await showConfirm('Se eliminará la cita definitivamente. ¿Continuar?', 'Eliminar cita'))) return;
    setGuardando(true);
    try {
      await citasPersonalApi.delete(`/Citas/${cita.idCita}`);
      router.back();
    } catch (e) {
      showError(mensajeErrorCitas(e, 'No se pudo eliminar la cita.'));
      setGuardando(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <DetalleCitaView cita={cita} />

      {puedeCambiar && siguientes.length > 0 && (
        <View style={styles.acciones}>
          {siguientes.map((e) => (
            <PrimaryButton
              key={e}
              title={ACCION_ESTADO[e] ?? e}
              variant={e === 'Cancelada' ? 'outline' : 'primary'}
              onPress={() => cambiarEstado(e)}
              disabled={guardando}
              fullWidth
            />
          ))}
        </View>
      )}
      {isAdmin && (cita.estado === 'Pendiente' || cita.estado === 'Confirmada') && (
        <View style={styles.reprogramar}>
          <PrimaryButton
            title="Reprogramar"
            variant="secondary"
            onPress={() => router.push({ pathname: '/agenda/reprogramar', params: { id: String(cita.idCita) } })}
            disabled={guardando}
            fullWidth
          />
        </View>
      )}
      {!puedeCambiar && siguientes.length > 0 && (
        <Text style={styles.nota}>Solo quien atiende la cita o un administrador puede cambiar su estado.</Text>
      )}

      {isAdmin && (
        <View style={styles.eliminar}>
          <PrimaryButton title="Eliminar cita" variant="danger" onPress={eliminar} disabled={guardando} fullWidth />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: SPACING.lg, paddingBottom: SPACING.huge, backgroundColor: COLORS.background, flexGrow: 1 },
  acciones: { gap: SPACING.md },
  nota: { fontSize: FONT_SIZE.subhead, color: COLORS.textSecondary, textAlign: 'center' },
  eliminar: { marginTop: SPACING.xxl },
  reprogramar: { marginTop: SPACING.md },
});
