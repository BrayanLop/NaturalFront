import FilterChips from '@/components/FilterChips';
import FormField from '@/components/FormField';
import KeyboardAware from '@/components/KeyboardAware';
import PrimaryButton from '@/components/PrimaryButton';
import { COLORS, FONT_SIZE, FONT_WEIGHT, RADIUS, SPACING, commonStyles } from '@/constants/theme';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import { mensajeDeError } from '@/utils/apiError';
import { logger, showError, showSuccess } from '@/utils/logger';
import { hashPassword } from '@/utils/password';
import { ROLES } from '@/utils/roles';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { ClienteAccesos } from '../../app/api/accesosClient';

const OPCIONES_ROL = [
  { key: ROLES.TRABAJADOR, label: 'Trabajador' },
  { key: ROLES.SUPER_EMPLEADO, label: 'Super Empleado' },
  { key: ROLES.ADMIN, label: 'Administrador' },
];

interface Props {
  cliente: ClienteAccesos;
  usuarioId: number;
  nombre?: string;
  usuario?: string;
  rolInicial?: string;
  onEliminado: () => void;
}

/** Detalle de un acceso: cambiar rol, restablecer contraseña y quitar el acceso. */
export default function DetalleAcceso({ cliente, usuarioId, nombre, usuario, rolInicial, onEliminado }: Props) {
  const { confirm } = useConfirmDialog();

  const [rol, setRol] = useState<string>(rolInicial || ROLES.TRABAJADOR);
  const [rolOriginal, setRolOriginal] = useState<string>(rolInicial || ROLES.TRABAJADOR);
  const [nuevaContrasena, setNuevaContrasena] = useState('');
  const [guardandoRol, setGuardandoRol] = useState(false);
  const [guardandoClave, setGuardandoClave] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [errorClave, setErrorClave] = useState('');

  const guardarRol = async () => {
    setGuardandoRol(true);
    try {
      await cliente.cambiarRol(usuarioId, rol);
      setRolOriginal(rol);
      showSuccess('Rol actualizado. El usuario verá el cambio al volver a iniciar sesión.');
    } catch (error) {
      logger.error('Error al cambiar rol:', error);
      showError(mensajeDeError(error, 'No se pudo cambiar el rol'));
    } finally {
      setGuardandoRol(false);
    }
  };

  const restablecerContrasena = async () => {
    if (nuevaContrasena.length < 6) {
      setErrorClave('Mínimo 6 caracteres');
      return;
    }
    setErrorClave('');
    setGuardandoClave(true);
    try {
      await cliente.restablecerContrasena(usuarioId, await hashPassword(nuevaContrasena));
      setNuevaContrasena('');
      showSuccess('Contraseña restablecida correctamente');
    } catch (error) {
      logger.error('Error al restablecer contraseña:', error);
      showError(mensajeDeError(error, 'No se pudo restablecer la contraseña'));
    } finally {
      setGuardandoClave(false);
    }
  };

  const eliminar = () =>
    confirm({
      title: 'Quitar acceso',
      message: `¿Quitar el acceso de ${nombre ?? 'este usuario'}? La persona y su historial se conservan, pero ya no podrá ingresar.`,
      onConfirm: async () => {
        setEliminando(true);
        try {
          await cliente.eliminar(usuarioId);
          showSuccess('Acceso eliminado');
          onEliminado();
        } catch (error) {
          logger.error('Error al eliminar acceso:', error);
          showError(mensajeDeError(error, 'No se pudo eliminar el acceso'));
        } finally {
          setEliminando(false);
        }
      },
    });

  return (
    <KeyboardAware>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.nombre}>{nombre}</Text>
          <Text style={styles.usuario}>Usuario: {usuario}</Text>
        </View>

        <View style={styles.card}>
          <FilterChips label="Rol" options={OPCIONES_ROL} selected={rol} onSelect={setRol} />
          <PrimaryButton title="Guardar rol" onPress={guardarRol} loading={guardandoRol} disabled={rol === rolOriginal} />
        </View>

        <View style={styles.card}>
          <FormField label="Nueva contraseña" error={errorClave}>
            <TextInput
              value={nuevaContrasena}
              onChangeText={setNuevaContrasena}
              style={[commonStyles.input, !!errorClave && styles.inputError]}
              placeholder="Nueva contraseña"
              secureTextEntry
              autoCapitalize="none"
              placeholderTextColor={COLORS.textTertiary}
            />
          </FormField>
          <PrimaryButton
            title="Restablecer contraseña"
            variant="secondary"
            onPress={restablecerContrasena}
            loading={guardandoClave}
          />
        </View>

        <PrimaryButton title="Quitar acceso" variant="danger" onPress={eliminar} loading={eliminando} />
      </ScrollView>
    </KeyboardAware>
  );
}

const styles = StyleSheet.create({
  container: { padding: SPACING.lg, backgroundColor: COLORS.background, flexGrow: 1, gap: SPACING.lg },
  card: { backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: SPACING.lg },
  nombre: { fontSize: FONT_SIZE.xl, fontWeight: FONT_WEIGHT.bold, color: COLORS.text },
  usuario: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, marginTop: SPACING.xs },
  inputError: { borderColor: COLORS.error },
});
