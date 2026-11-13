import { AppText, Badge, Button, Card, ChipGroup, EmptyState, Input, LoadingState } from '@/components/ds';
import KeyboardAware from '@/components/KeyboardAware';
import { useAuth } from '@/context/authContext';
import { FONT_SIZE, FONT_WEIGHT, RADIUS, SPACING, sombra, useEstilos, type Tema } from '@/theme';
import { mensajeDeError } from '@/utils/apiError';
import { logger, showConfirm, showError, showSuccess } from '@/utils/logger';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { EmpresaPlataforma, Impersonacion } from '../../../../api/modelos/empresaPlataforma';
import { plataformaApi } from '../../../../api/plataformaApi';

const MINUTOS = [
  { key: '15', label: '15 min' },
  { key: '30', label: '30 min' },
  { key: '60', label: '1 hora' },
  { key: '120', label: '2 horas' },
];

const crearEstilos = (t: Tema) => ({
  container: { padding: SPACING.lg, backgroundColor: t.colores.fondo, flexGrow: 1 },
  titulo: { flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const, gap: SPACING.md },
  nombre: { flex: 1, minWidth: 0, fontSize: FONT_SIZE.title3, fontWeight: FONT_WEIGHT.bold, color: t.colores.texto },
  acciones: { gap: SPACING.md, marginTop: SPACING.xs },
  backdrop: { flex: 1, backgroundColor: t.colores.overlay, justifyContent: 'center' as const, padding: SPACING.lg },
  modal: {
    backgroundColor: t.colores.superficieElevada,
    borderRadius: RADIUS.xxl,
    borderWidth: 1,
    borderColor: t.colores.borde,
    padding: SPACING.xl,
    ...sombra(t, 'lg'),
  },
  modalTitulo: { fontSize: FONT_SIZE.title3, fontWeight: FONT_WEIGHT.bold, color: t.colores.texto },
  modalAyuda: { fontSize: FONT_SIZE.subhead, color: t.colores.textoSuave, marginTop: SPACING.xs, marginBottom: SPACING.lg, lineHeight: 19 },
  modalAcciones: { gap: SPACING.sm },
});

export default function DetalleEmpresa() {
  const router = useRouter();
  const estilos = useEstilos(crearEstilos);
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

  if (cargando) return <LoadingState message="Cargando empresa..." />;
  if (!empresa) {
    return <EmptyState icon="business-outline" title="La empresa no existe" />;
  }

  const campo = (key: keyof typeof form, label: string, extra?: object) => (
    <Input
      key={key}
      label={label}
      value={form[key]}
      onChangeText={(t) => setForm((prev) => ({ ...prev, [key]: t }))}
      placeholder={label}
      {...extra}
    />
  );

  return (
    <>
      <KeyboardAware>
        <ScrollView contentContainerStyle={estilos.container} keyboardShouldPersistTaps="handled">
          <Card>
            <View style={estilos.titulo}>
              <Text style={estilos.nombre} numberOfLines={2}>
                {empresa.nombre}
              </Text>
              <Badge label={empresa.activa ? 'Activa' : 'Inactiva'} tone={empresa.activa ? 'success' : 'neutral'} />
            </View>
            <AppText variante="nota" tono="suave" style={{ marginTop: SPACING.xs }}>
              {empresa.totalPersonas} personas · {empresa.accesosActivos}/{empresa.totalAccesos} accesos activos
            </AppText>
          </Card>

          <Card>
            {campo('nombre', 'Nombre')}
            {campo('nit', 'NIT')}
            {campo('direccion', 'Dirección')}
            {campo('telefono', 'Teléfono', { keyboardType: 'phone-pad' })}
            <Button title="Guardar cambios" icon="checkmark" onPress={guardar} loading={guardando} />
          </Card>

          <View style={estilos.acciones}>
            <Button
              title="Administrar accesos"
              variant="secondary"
              icon="people-outline"
              onPress={() =>
                router.push({ pathname: '/plataforma/empresas/[id]/accesos', params: { id: String(empresaId) } })
              }
            />
            <Button
              title="Entrar como esta empresa (soporte)"
              variant="secondary"
              icon="shield-checkmark-outline"
              disabled={!empresa.activa}
              onPress={() => setSoporteVisible(true)}
            />
            <Button
              title={empresa.activa ? 'Desactivar empresa' : 'Activar empresa'}
              variant={empresa.activa ? 'danger' : 'primary'}
              icon={empresa.activa ? 'power-outline' : 'checkmark-circle-outline'}
              onPress={cambiarEstado}
            />
          </View>
        </ScrollView>
      </KeyboardAware>

      <Modal visible={soporteVisible} transparent animationType="fade" onRequestClose={() => setSoporteVisible(false)}>
        <Pressable style={estilos.backdrop} onPress={() => !entrando && setSoporteVisible(false)}>
          <Pressable style={estilos.modal} onPress={() => undefined}>
            <Text style={estilos.modalTitulo}>Entrar como {empresa.nombre}</Text>
            <Text style={estilos.modalAyuda}>
              Entrarás como administrador de la empresa. Queda registrado en la auditoría con tu nombre y el motivo.
            </Text>
            <Input
              label="Motivo"
              value={motivo}
              onChangeText={setMotivo}
              placeholder="Ej.: revisar el cierre de caja que reportó el cliente"
              multiline
              maxLength={300}
            />
            <ChipGroup label="Duración" options={MINUTOS} value={minutos} onChange={setMinutos} />
            <View style={estilos.modalAcciones}>
              <Button title="Entrar" icon="log-in-outline" onPress={entrarComo} loading={entrando} />
              <Button title="Cancelar" variant="ghost" onPress={() => setSoporteVisible(false)} disabled={entrando} />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
