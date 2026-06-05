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
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { citasApi } from '../../api/citasApi';
import { EmpresaCita, UsuarioCita } from '../../api/modelos/citas';

const HORAS = Array.from({ length: 13 }, (_, i) => 7 + i); // 07:00 a 19:00
const MINUTOS = ['00', '15', '30', '45'];

export default function AgendarCita() {
  const router = useRouter();
  const { session, login } = useCitasAuth();
  const esEmpresa = session?.mode === 'empresa';

  const [empresas, setEmpresas] = useState<EmpresaCita[]>([]);
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState(session?.tenant ?? '');
  const [usuarios, setUsuarios] = useState<UsuarioCita[]>([]);
  const [empleados, setEmpleados] = useState<UsuarioCita[]>([]);
  const [cargando, setCargando] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadingEmpresa, setLoadingEmpresa] = useState(false);

  const [idCliente, setIdCliente] = useState<number | null>(esEmpresa ? null : session?.userId ?? null);
  const [idEmpleado, setIdEmpleado] = useState<number | null>(null);
  const [fecha, setFecha] = useState(toDateInputValue(new Date()));
  const [hora, setHora] = useState(9);
  const [minuto, setMinuto] = useState('00');
  const [showDate, setShowDate] = useState(false);

  useEffect(() => {
    if (empresas.length > 0) return;

    const cargar = async () => {
      try {
        const [empresasRes, usuariosRes] = await Promise.all([
          citasApi.get<EmpresaCita[]>('/Empresas'),
          citasApi.get<UsuarioCita[]>('/Usuarios'),
        ]);

        const activas = empresasRes.data.filter((e) => e.activo);
        setEmpresas(activas);
        if (!empresaSeleccionada && activas.length > 0) {
          setEmpresaSeleccionada(session?.tenant ?? activas[0].id);
        }

        setUsuarios(usuariosRes.data);
        if (usuariosRes.data.length > 0) {
          setIdEmpleado((current) => current ?? usuariosRes.data[0].id);
          if (esEmpresa) setIdCliente((current) => current ?? usuariosRes.data[0].id);
        }
      } catch (error) {
        logger.error('[Citas] Error al cargar empresas o usuarios:', error);
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, [empresaSeleccionada, esEmpresa, session?.tenant, empresas.length]);

  useEffect(() => {
    const filtrados = usuarios.filter((u) =>
      u.empresaId ? u.empresaId === empresaSeleccionada : true
    );
    setEmpleados(filtrados.length > 0 ? filtrados : usuarios);
  }, [empresaSeleccionada, usuarios]);

  useEffect(() => {
    if (!esEmpresa && session?.userId != null) {
      setIdCliente(session.userId);
    }
  }, [session?.userId, esEmpresa]);

  const handleEmpresaChange = async (tenant: string) => {
    setEmpresaSeleccionada(tenant);
    if (tenant === session?.tenant || !session?.usuario) return;

    setLoadingEmpresa(true);
    try {
      const empresaNombre = empresas.find((e) => e.id === tenant)?.nombre || tenant;
      await login({ tenant, empresaNombre, usuario: session.usuario, mode: 'cliente' });
      const { data } = await citasApi.get<UsuarioCita[]>('/Usuarios');
      setUsuarios(data);
      if (data.length > 0) {
        setIdEmpleado((current) => current ?? data[0].id);
      }
    } catch {
      showError('No se pudo cambiar de empresa. Intenta de nuevo.', 'Error');
    } finally {
      setLoadingEmpresa(false);
    }
  };

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

        {!esEmpresa && (
          <FormField label="Empresa">
            {cargando ? (
              <LoadingView message="Cargando empresas..." />
            ) : (
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={empresaSeleccionada}
                  onValueChange={(value) => handleEmpresaChange(String(value))}
                >
                  {empresas.map((empresa) => (
                    <Picker.Item
                      key={empresa.id}
                      label={`${empresa.nombre} (${empresa.id})`}
                      value={empresa.id}
                    />
                  ))}
                </Picker>
              </View>
            )}
            {loadingEmpresa && <ActivityIndicator color={COLORS.primary} style={{ marginTop: SPACING.md }} />}
          </FormField>
        )}

        <FormField label={esEmpresa ? 'Atendido por' : 'Quién atiende'}>
          {cargando || loadingEmpresa ? (
            <LoadingView message="Cargando empleados..." />
          ) : empleados.length > 0 ? (
            <View style={styles.pickerWrapper}>
              <Picker selectedValue={idEmpleado} onValueChange={(v) => setIdEmpleado(Number(v))}>
                {empleados.map((u) => (
                  <Picker.Item key={u.id} label={u.nombreUsuario} value={u.id} />
                ))}
              </Picker>
            </View>
          ) : (
            <Text style={styles.emptyText}>
              No hay barberos disponibles para la empresa seleccionada.
            </Text>
          )}
        </FormField>

        <FormField label="Fecha">
          <Pressable style={styles.dateButton} onPress={() => setShowDate(true)}>
            <FontAwesome5 name="calendar-alt" size={16} color={COLORS.primary} />
            <Text style={styles.dateText}>{formatDate(fecha)}</Text>
          </Pressable>
        </FormField>

        <FormField label="Hora">
          <View style={styles.horaRow}>
            <View style={styles.timeInputBox}>
              <Picker selectedValue={hora} onValueChange={(v) => setHora(Number(v))}>
                {HORAS.map((h) => (
                  <Picker.Item key={h} label={`${String(h).padStart(2, '0')} h`} value={h} />
                ))}
              </Picker>
            </View>
            <View style={styles.timeInputBox}>
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
  timeInputBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    overflow: 'hidden',
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,
    marginTop: SPACING.sm,
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
