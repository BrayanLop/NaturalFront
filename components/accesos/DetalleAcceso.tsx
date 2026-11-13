import { AppText, Badge, Button, Card, ChipGroup, ConfirmDialog, Icon, Input, SectionHeader } from '@/components/ds';
import KeyboardAware from '@/components/KeyboardAware';
import { RADIUS, SPACING, useEstilos, useTheme, type Tema } from '@/theme';
import { mensajeDeError } from '@/utils/apiError';
import { logger, showError, showSuccess } from '@/utils/logger';
import { hashPassword } from '@/utils/password';
import { ROLES, getRoleName } from '@/utils/roles';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
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

const crearEstilos = (t: Tema) => ({
  container: { padding: SPACING.lg, backgroundColor: t.colores.fondo, flexGrow: 1 },
  cabecera: { flexDirection: 'row' as const, alignItems: 'center' as const },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: RADIUS.full,
    backgroundColor: t.colores.primarioSuave,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: SPACING.md,
  },
  textos: { flex: 1, minWidth: 0 },
  espacio: { height: SPACING.md },
});

/** Detalle de un acceso: cambiar rol, restablecer contraseña y quitar el acceso. */
export default function DetalleAcceso({ cliente, usuarioId, nombre, usuario, rolInicial, onEliminado }: Props) {
  const estilos = useEstilos(crearEstilos);
  const { tema } = useTheme();

  const [rol, setRol] = useState<string>(rolInicial || ROLES.TRABAJADOR);
  const [rolOriginal, setRolOriginal] = useState<string>(rolInicial || ROLES.TRABAJADOR);
  const [nuevaContrasena, setNuevaContrasena] = useState('');
  const [guardandoRol, setGuardandoRol] = useState(false);
  const [guardandoClave, setGuardandoClave] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [confirmarEliminar, setConfirmarEliminar] = useState(false);
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

  const eliminar = async () => {
    setEliminando(true);
    try {
      await cliente.eliminar(usuarioId);
      setConfirmarEliminar(false);
      showSuccess('Acceso eliminado');
      onEliminado();
    } catch (error) {
      logger.error('Error al eliminar acceso:', error);
      setConfirmarEliminar(false);
      showError(mensajeDeError(error, 'No se pudo eliminar el acceso'));
    } finally {
      setEliminando(false);
    }
  };

  return (
    <KeyboardAware>
      <ScrollView contentContainerStyle={estilos.container} keyboardShouldPersistTaps="handled">
        <Card>
          <View style={estilos.cabecera}>
            <View style={estilos.avatar}>
              <Icon name="person-outline" size={26} color={tema.colores.primarioTexto} />
            </View>
            <View style={estilos.textos}>
              <AppText variante="subtitulo" numberOfLines={1}>
                {nombre}
              </AppText>
              <AppText variante="nota" tono="suave">
                Usuario: {usuario}
              </AppText>
              <View style={{ marginTop: SPACING.xs + 2 }}>
                <Badge label={getRoleName(rolOriginal)} tone="info" size="sm" />
              </View>
            </View>
          </View>
        </Card>

        <Card>
          <SectionHeader title="Rol" icon="shield-checkmark-outline" style={{ marginTop: 0 }} />
          <ChipGroup options={OPCIONES_ROL} value={rol} onChange={setRol} />
          <Button title="Guardar rol" icon="checkmark" onPress={guardarRol} loading={guardandoRol} disabled={rol === rolOriginal} />
        </Card>

        <Card>
          <SectionHeader title="Contraseña" icon="key-outline" style={{ marginTop: 0 }} />
          <Input
            label="Nueva contraseña"
            leftIcon="lock-closed-outline"
            value={nuevaContrasena}
            onChangeText={setNuevaContrasena}
            error={errorClave || undefined}
            placeholder="Nueva contraseña"
            secureTextEntry
            autoCapitalize="none"
          />
          <Button
            title="Restablecer contraseña"
            variant="secondary"
            onPress={restablecerContrasena}
            loading={guardandoClave}
          />
        </Card>

        <View style={estilos.espacio} />
        <Button
          title="Quitar acceso"
          variant="danger"
          icon="trash-outline"
          onPress={() => setConfirmarEliminar(true)}
        />
      </ScrollView>

      <ConfirmDialog
        visible={confirmarEliminar}
        destructive
        title="Quitar acceso"
        message={`¿Quitar el acceso de ${nombre ?? 'este usuario'}? La persona y su historial se conservan, pero ya no podrá ingresar.`}
        confirmLabel="Quitar acceso"
        loading={eliminando}
        onConfirm={eliminar}
        onCancel={() => setConfirmarEliminar(false)}
      />
    </KeyboardAware>
  );
}
