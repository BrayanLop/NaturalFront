import FormField from '@/components/FormField';
import LoadingView from '@/components/LoadingView';
import PrimaryButton from '@/components/PrimaryButton';
import { COLORS, FONT_SIZE, FONT_WEIGHT, RADIUS, SHADOWS, SPACING, commonStyles } from '@/constants/theme';
import { useCitasAuth } from '@/context/citasAuthContext';
import { formatDate } from '@/utils/formatters';
import { logger, showConfirm, showError, showSuccess } from '@/utils/logger';
import { FontAwesome5 } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { citasApi } from '../../api/citasApi';
import { CitaCita, ESTADOS_CITA, UsuarioCita } from '../../api/modelos/citas';
import { estadoColor } from '../_estado';

export default function DetalleCita() {
  const router = useRouter();
  const { session } = useCitasAuth();
  const esEmpresa = session?.mode === 'empresa';
  const { id } = useLocalSearchParams<{ id: string }>();
  const idCita = Number(id);

  const [cita, setCita] = useState<CitaCita | null>(null);
  const [usuarios, setUsuarios] = useState<Record<number, string>>({});
  const [estado, setEstado] = useState<string>('Pendiente');
  const [cargando, setCargando] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const cargar = async () => {
      try {
        const [citasRes, usuariosRes] = await Promise.all([
          citasApi.get<CitaCita[]>('/Citas'),
          citasApi.get<UsuarioCita[]>('/Usuarios').catch(() => ({ data: [] as UsuarioCita[] })),
        ]);
        const mapa: Record<number, string> = {};
        usuariosRes.data.forEach((u) => (mapa[u.id] = u.nombreUsuario));
        setUsuarios(mapa);

        const encontrada = citasRes.data.find((c) => c.idCita === idCita);
        if (encontrada) {
          setCita(encontrada);
          setEstado(encontrada.estado);
        } else {
          showError('Cita no encontrada');
          router.back();
        }
      } catch (error) {
        logger.error('[Citas] Error al cargar la cita:', error);
        showError('No se pudo cargar la cita');
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, [idCita]);

  const actualizarEstado = async () => {
    setLoading(true);
    try {
      await citasApi.patch(`/Citas/${idCita}`, { estado });
      showSuccess('Estado actualizado');
      router.replace('/citas/agenda');
    } catch (error) {
      logger.error('[Citas] Error al actualizar estado:', error);
      showError('No se pudo actualizar el estado');
    } finally {
      setLoading(false);
    }
  };

  const cancelar = async () => {
    const ok = await showConfirm('¿Cancelar esta cita?', 'Confirmar');
    if (!ok) return;
    setLoading(true);
    try {
      await citasApi.patch(`/Citas/${idCita}`, { estado: 'Cancelada' });
      showSuccess('Cita cancelada');
      router.replace('/citas/agenda');
    } catch (error) {
      logger.error('[Citas] Error al cancelar cita:', error);
      showError('No se pudo cancelar la cita');
    } finally {
      setLoading(false);
    }
  };

  const eliminar = async () => {
    const ok = await showConfirm('¿Eliminar esta cita permanentemente?', 'Confirmar');
    if (!ok) return;
    setLoading(true);
    try {
      await citasApi.delete(`/Citas/${idCita}`);
      showSuccess('Cita eliminada');
      router.replace('/citas/agenda');
    } catch (error) {
      logger.error('[Citas] Error al eliminar cita:', error);
      showError('No se pudo eliminar la cita');
    } finally {
      setLoading(false);
    }
  };

  if (cargando || !cita) return <LoadingView message="Cargando cita..." />;

  const hora = cita.horaEstimadaCita?.slice(0, 5) ?? '';
  const cliente = usuarios[cita.idCliente] ?? `Cliente #${cita.idCliente}`;
  const empleado = usuarios[cita.idEmpleado] ?? `Empleado #${cita.idEmpleado}`;
  const cancelable = cita.estado !== 'Cancelada' && cita.estado !== 'Completada';

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <View style={styles.cardRow}>
          <FontAwesome5 name="calendar-day" size={16} color={COLORS.primary} />
          <Text style={styles.cardLabel}>Fecha</Text>
          <Text style={styles.cardValue}>{formatDate(cita.fechaCita)}</Text>
        </View>
        <View style={styles.cardRow}>
          <FontAwesome5 name="clock" size={16} color={COLORS.primary} />
          <Text style={styles.cardLabel}>Hora</Text>
          <Text style={styles.cardValue}>{hora}</Text>
        </View>
        <View style={styles.cardRow}>
          <FontAwesome5 name="user" size={16} color={COLORS.primary} />
          <Text style={styles.cardLabel}>Cliente</Text>
          <Text style={styles.cardValue}>{cliente}</Text>
        </View>
        <View style={styles.cardRow}>
          <FontAwesome5 name="user-tie" size={16} color={COLORS.primary} />
          <Text style={styles.cardLabel}>Atiende</Text>
          <Text style={styles.cardValue}>{empleado}</Text>
        </View>
        <View style={styles.cardRow}>
          <FontAwesome5 name="info-circle" size={16} color={COLORS.primary} />
          <Text style={styles.cardLabel}>Estado</Text>
          <View style={[styles.estadoBadge, { backgroundColor: estadoColor(cita.estado) }]}>
            <Text style={styles.estadoText}>{cita.estado}</Text>
          </View>
        </View>
      </View>

      {esEmpresa ? (
        <>
          <FormField label="Cambiar estado">
            <View style={styles.pickerWrapper}>
              <Picker selectedValue={estado} onValueChange={(v) => setEstado(String(v))}>
                {ESTADOS_CITA.map((e) => (
                  <Picker.Item key={e} label={e} value={e} />
                ))}
              </Picker>
            </View>
          </FormField>
          <PrimaryButton title="Actualizar estado" onPress={actualizarEstado} loading={loading} />
          <View style={{ height: SPACING.md }} />
          <PrimaryButton title="Eliminar cita" onPress={eliminar} loading={loading} variant="danger" />
        </>
      ) : (
        cancelable && (
          <PrimaryButton title="Cancelar cita" onPress={cancelar} loading={loading} variant="danger" />
        )
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { ...commonStyles.scrollContainer },
  card: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.xl,
    ...SHADOWS.sm,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.sm,
  },
  cardLabel: {
    fontSize: FONT_SIZE.body,
    color: COLORS.textSecondary,
    width: 70,
  },
  cardValue: {
    flex: 1,
    fontSize: FONT_SIZE.body,
    color: COLORS.text,
    fontWeight: FONT_WEIGHT.semibold,
    textAlign: 'right',
  },
  estadoBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xxs,
    borderRadius: RADIUS.sm,
  },
  estadoText: {
    color: COLORS.white,
    fontSize: FONT_SIZE.caption,
    fontWeight: FONT_WEIGHT.semibold,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    overflow: 'hidden',
  },
});
