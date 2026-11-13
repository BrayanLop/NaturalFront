import FilterChips from '@/components/FilterChips';
import FormField from '@/components/FormField';
import KeyboardAware from '@/components/KeyboardAware';
import LoadingView from '@/components/LoadingView';
import PrimaryButton from '@/components/PrimaryButton';
import StatusBadge from '@/components/StatusBadge';
import { COLORS, FONT_SIZE, FONT_WEIGHT, RADIUS, SPACING, commonStyles } from '@/constants/theme';
import { useAuth } from '@/context/authContext';
import { mensajeDeError } from '@/utils/apiError';
import { logger, showConfirm, showError, showSuccess } from '@/utils/logger';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { EmpresaPlataforma, Impersonacion } from '../../../../api/modelos/empresaPlataforma';
import { plataformaApi } from '../../../../api/plataformaApi';

const MINUTOS = [
  { key: '15', label: '15 min' },
  { key: '30', label: '30 min' },
  { key: '60', label: '1 hora' },
  { key: '120', label: '2 horas' },
];

export default function DetalleEmpresa() {
  const router = useRouter();
  const { entrarComoSoporte } = useAuth();
  const params = useLocalSearchParams<{ id: string }>();
  const empresaId = Number(params.id);

  const [empresa, setEmpresa] = useState<EmpresaPlataforma | null>(null);
  const [cargando, setCargando] = useState(true);
  const [form, setForm] = useState({ nombre: '', nit: '', direccion: '', telefono: '' });
  const [guardando, setGuardando] = useState(false);

  // Modo soporte
  const [soporteVisible, setSoporteVisible] = useState(false);
  const [motivo, setMotivo] = useState('');
  const [minutos, setMinutos] = useState('30');
  const [entrando, setEntrando] = useState(false);

  const cargar = async () => {
    try {
      // No hay "obtener por id": se toma de la lista.
      const lista: EmpresaPlataforma[] = (await plataformaApi.get('/Empresas')).data;
      const e = lista.find((x) => x.id === empresaId) ?? null;
      setEmpresa(e);
      if (e) setForm({ nombre: e.nombre ?? '', nit: e.nit ?? '', direccion: e.direccion ?? '', telefono: e.telefono ?? '' });
    } catch (error) {
      logger.error('Error al cargar la empresa:', error);
      showError(mensajeDeError(error, 'No se pudo cargar la empresa'));
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
  }, [empresaId]);

  const guardar = async () => {
    if (form.nombre.trim().length < 2) {
      showError('El nombre de la empresa es obligatorio');
      return;
    }
    setGuardando(true);
    try {
      await plataformaApi.put(`/Empresas/${empresaId}`, {
        nombre: form.nombre.trim(),
        nit: form.nit.trim() || null,
        direccion: form.direccion.trim() || null,
        telefono: form.telefono.trim() || null,
      });
      showSuccess('Empresa actualizada');
      await cargar();
    } catch (error) {
      showError(mensajeDeError(error, 'No se pudo actualizar la empresa'));
    } finally {
      setGuardando(false);
    }
  };

  const cambiarEstado = async () => {
    if (!empresa) return;
    const activa = !empresa.activa;
    if (!activa) {
      const ok = await showConfirm(
        `¿Desactivar ${empresa.nombre}? Nadie de esa empresa podrá ingresar ni seguir usando la aplicación.`,
        'Desactivar empresa'
      );
      if (!ok) return;
    }
    try {
      await plataformaApi.patch(`/Empresas/${empresaId}/Estado`, null, { params: { activa } });
      await cargar();
    } catch (error) {
      showError(mensajeDeError(error, 'No se pudo cambiar el estado'));
    }
  };

  const entrarComo = async () => {
    if (motivo.trim().length < 5) {
      showError('Escribe el motivo del acceso (mínimo 5 caracteres)');
      return;
    }
    setEntrando(true);
    try {
      const res: Impersonacion = (
        await plataformaApi.post(`/Empresas/${empresaId}/Impersonar`, { motivo: motivo.trim(), minutos: Number(minutos) })
      ).data;

      await entrarComoSoporte({
        id: res.persona.id,
        idUsuario: res.persona.idUsuario,
        nombre: res.persona.nombre,
        empresaId: res.persona.empresaId,
        rol: res.persona.rol,
        nombreEmpresa: res.persona.nombreEmpresa ?? empresa?.nombre ?? undefined,
        token: res.token,
        soporte: { expiraEn: res.expiraEn, nombreEmpresa: res.persona.nombreEmpresa ?? empresa?.nombre ?? 'Empresa' },
      });
      setSoporteVisible(false);
      setMotivo('');
      router.replace('/home');
    } catch (error) {
      logger.error('Error al entrar en modo soporte:', error);
      showError(mensajeDeError(error, 'No se pudo entrar como la empresa'));
    } finally {
      setEntrando(false);
    }
  };

  if (cargando) return <LoadingView message="Cargando empresa..." />;
  if (!empresa) {
    return (
      <View style={styles.vacio}>
        <Text style={styles.vacioTexto}>La empresa no existe</Text>
      </View>
    );
  }

  const campo = (key: keyof typeof form, label: string, extra?: object) => (
    <FormField key={key} label={label}>
      <TextInput
        value={form[key]}
        onChangeText={(t) => setForm((prev) => ({ ...prev, [key]: t }))}
        style={commonStyles.input}
        placeholder={label}
        placeholderTextColor={COLORS.textTertiary}
        {...extra}
      />
    </FormField>
  );

  return (
    <>
      <KeyboardAware>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.card}>
            <View style={styles.titulo}>
              <Text style={styles.nombre}>{empresa.nombre}</Text>
              <StatusBadge label={empresa.activa ? 'Activa' : 'Inactiva'} type={empresa.activa ? 'disponible' : 'rechazado'} />
            </View>
            <Text style={styles.resumen}>
              {empresa.totalPersonas} personas · {empresa.accesosActivos}/{empresa.totalAccesos} accesos activos
            </Text>
          </View>

          <View style={styles.card}>
            {campo('nombre', 'Nombre')}
            {campo('nit', 'NIT')}
            {campo('direccion', 'Dirección')}
            {campo('telefono', 'Teléfono', { keyboardType: 'phone-pad' })}
            <PrimaryButton title="Guardar cambios" onPress={guardar} loading={guardando} />
          </View>

          <PrimaryButton
            title="Administrar accesos"
            variant="secondary"
            onPress={() =>
              router.push({ pathname: '/plataforma/empresas/[id]/accesos', params: { id: String(empresaId) } })
            }
          />
          <PrimaryButton
            title="Entrar como esta empresa (soporte)"
            variant="outline"
            disabled={!empresa.activa}
            onPress={() => setSoporteVisible(true)}
          />
          <PrimaryButton
            title={empresa.activa ? 'Desactivar empresa' : 'Activar empresa'}
            variant={empresa.activa ? 'danger' : 'primary'}
            onPress={cambiarEstado}
          />
        </ScrollView>
      </KeyboardAware>

      <Modal visible={soporteVisible} transparent animationType="fade" onRequestClose={() => setSoporteVisible(false)}>
        <Pressable style={styles.backdrop} onPress={() => !entrando && setSoporteVisible(false)}>
          <Pressable style={styles.modal} onPress={() => undefined}>
            <Text style={styles.modalTitulo}>Entrar como {empresa.nombre}</Text>
            <Text style={styles.modalAyuda}>
              Entrarás como administrador de la empresa. Queda registrado en la auditoría con tu nombre y el motivo.
            </Text>
            <FormField label="Motivo">
              <TextInput
                value={motivo}
                onChangeText={setMotivo}
                style={[commonStyles.input, styles.motivo]}
                placeholder="Ej.: revisar el cierre de caja que reportó el cliente"
                placeholderTextColor={COLORS.textTertiary}
                multiline
                maxLength={300}
              />
            </FormField>
            <FilterChips label="Duración" options={MINUTOS} selected={minutos} onSelect={setMinutos} />
            <PrimaryButton title="Entrar" onPress={entrarComo} loading={entrando} />
            <PrimaryButton title="Cancelar" variant="ghost" onPress={() => setSoporteVisible(false)} disabled={entrando} />
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { padding: SPACING.lg, backgroundColor: COLORS.background, flexGrow: 1, gap: SPACING.lg },
  card: { backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: SPACING.lg },
  titulo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: SPACING.md },
  nombre: { flex: 1, fontSize: FONT_SIZE.xl, fontWeight: FONT_WEIGHT.bold, color: COLORS.text },
  resumen: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, marginTop: SPACING.xs },
  vacio: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  vacioTexto: { color: COLORS.textSecondary, fontSize: FONT_SIZE.body },
  backdrop: { flex: 1, backgroundColor: COLORS.overlay, justifyContent: 'center', padding: SPACING.lg },
  modal: { backgroundColor: COLORS.white, borderRadius: RADIUS.xl, padding: SPACING.lg, gap: SPACING.md },
  modalTitulo: { fontSize: FONT_SIZE.xl, fontWeight: FONT_WEIGHT.bold, color: COLORS.text },
  modalAyuda: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary },
  motivo: { minHeight: 80, textAlignVertical: 'top' },
});
