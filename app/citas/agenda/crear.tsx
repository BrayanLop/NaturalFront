import FormField from '@/components/FormField';
import LoadingView from '@/components/LoadingView';
import PrimaryButton from '@/components/PrimaryButton';
import SimpleDatePicker from '@/components/SimpleDatePicker';
import { COLORS, FONT_SIZE, RADIUS, SPACING, commonStyles } from '@/constants/theme';
import { useCitasAuth } from '@/context/citasAuthContext';
import { formatDate, toDateInputValue } from '@/utils/formatters';
import { logger, showError, showSuccess } from '@/utils/logger';
import { FontAwesome5 } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { citasApi } from '../../api/citasApi';
import { UsuarioCita } from '../../api/modelos/citas';

const HORAS = Array.from({ length: 13 }, (_, i) => 7 + i); // 07:00 a 19:00
const MINUTOS = ['00', '15', '30', '45'];

export default function AgendarCita() {
  const router = useRouter();
  const { session } = useCitasAuth();
  const esEmpresa = session?.mode === 'empresa';

  const [usuarios, setUsuarios] = useState<UsuarioCita[]>([]);
  const [cargando, setCargando] = useState(true);
  const [loading, setLoading] = useState(false);

  const [idCliente, setIdCliente] = useState<number | null>(esEmpresa ? null : session?.userId ?? null);
  const [idEmpleado, setIdEmpleado] = useState<number | null>(null);
  const [fecha, setFecha] = useState(toDateInputValue(new Date()));
  const [hora, setHora] = useState(9);
  const [minuto, setMinuto] = useState('00');
  const [showDate, setShowDate] = useState(false);

  useEffect(() => {
    const cargar = async () => {
      try {
        const { data } = await citasApi.get<UsuarioCita[]>('/Usuarios');
        setUsuarios(data);
        if (data.length > 0) {
          setIdEmpleado(data[0].id);
          if (esEmpresa) setIdCliente(data[0].id);
        }
      } catch (error) {
        logger.error('[Citas] Error al cargar usuarios:', error);
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, []);

  const guardar = async () => {
    if (idCliente == null) {
      showError('Selecciona el cliente', 'Cliente requerido');
      return;
    }
    if (idEmpleado == null) {
      showError('Selecciona quién atiende', 'Empleado requerido');
      return;
    }

    setLoading(true);
    try {
      await citasApi.post('/Citas', {
        idCliente,
        idEmpleado,
        fechaCita: `${fecha}T00:00:00`,
        horaEstimadaCita: `${String(hora).padStart(2, '0')}:${minuto}:00`,
      });
      showSuccess('Cita agendada correctamente');
      router.replace('/citas/agenda');
    } catch (error: any) {
      logger.error('[Citas] Error al agendar cita:', error);
      const mensaje =
        typeof error?.response?.data === 'string'
          ? error.response.data
          : 'No se pudo agendar la cita';
      showError(mensaje);
    } finally {
      setLoading(false);
    }
  };

  if (cargando) return <LoadingView message="Cargando..." />;

  return (
    <>
      <ScrollView contentContainerStyle={styles.container}>
        {esEmpresa && (
          <FormField label="Cliente">
            <View style={styles.pickerWrapper}>
              <Picker selectedValue={idCliente} onValueChange={(v) => setIdCliente(Number(v))}>
                {usuarios.map((u) => (
                  <Picker.Item key={u.id} label={u.nombreUsuario} value={u.id} />
                ))}
              </Picker>
            </View>
          </FormField>
        )}

        <FormField label="Atendido por">
          <View style={styles.pickerWrapper}>
            <Picker selectedValue={idEmpleado} onValueChange={(v) => setIdEmpleado(Number(v))}>
              {usuarios.map((u) => (
                <Picker.Item key={u.id} label={u.nombreUsuario} value={u.id} />
              ))}
            </Picker>
          </View>
        </FormField>

        <FormField label="Fecha">
          <Pressable style={styles.dateButton} onPress={() => setShowDate(true)}>
            <FontAwesome5 name="calendar-alt" size={16} color={COLORS.primary} />
            <Text style={styles.dateText}>{formatDate(fecha)}</Text>
          </Pressable>
        </FormField>

        <FormField label="Hora">
          <View style={styles.horaRow}>
            <View style={[styles.pickerWrapper, { flex: 1 }]}>
              <Picker selectedValue={hora} onValueChange={(v) => setHora(Number(v))}>
                {HORAS.map((h) => (
                  <Picker.Item key={h} label={`${String(h).padStart(2, '0')} h`} value={h} />
                ))}
              </Picker>
            </View>
            <View style={[styles.pickerWrapper, { flex: 1 }]}>
              <Picker selectedValue={minuto} onValueChange={(v) => setMinuto(String(v))}>
                {MINUTOS.map((m) => (
                  <Picker.Item key={m} label={`${m} min`} value={m} />
                ))}
              </Picker>
            </View>
          </View>
        </FormField>

        <PrimaryButton title="Agendar cita" onPress={guardar} loading={loading} />
      </ScrollView>

      <SimpleDatePicker
        value={fecha}
        onChange={setFecha}
        visible={showDate}
        onClose={() => setShowDate(false)}
        title="Fecha de la cita"
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: { ...commonStyles.scrollContainer },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    overflow: 'hidden',
  },
  horaRow: { flexDirection: 'row', gap: SPACING.md },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    height: 48,
    paddingHorizontal: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
  },
  dateText: { fontSize: FONT_SIZE.body, color: COLORS.text },
});
