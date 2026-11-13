import { AppText, Button, Card, Icon, Input } from '@/components/ds';
import KeyboardAware from '@/components/KeyboardAware';
import { useAuth } from '@/context/authContext';
import { SPACING, useEstilos, useTheme, type Tema } from '@/theme';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, View } from 'react-native';
import { logger } from '@/utils/logger';
import { hashPassword } from '@/utils/password';
import { api } from '../api/api';

const crearEstilos = (t: Tema) => ({
  contenedor: { flex: 1, padding: SPACING.lg, backgroundColor: t.colores.fondo },
  cabecera: { alignItems: 'center' as const, paddingVertical: SPACING.lg, marginBottom: SPACING.md },
  circulo: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: t.colores.primarioSuave,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginBottom: SPACING.md,
  },
});

export default function CambiarContrasena() {
  const { usuario } = useAuth();
  const router = useRouter();
  const estilos = useEstilos(crearEstilos);
  const { tema } = useTheme();
  const [contrasenaActual, setContrasenaActual] = useState('');
  const [nuevaContrasena, setNuevaContrasena] = useState('');
  const [confirmarContrasena, setConfirmarContrasena] = useState('');
  const [verActual, setVerActual] = useState(false);
  const [verNueva, setVerNueva] = useState(false);
  const [verConfirmar, setVerConfirmar] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCambiarContrasena = async () => {
    // Validaciones
    if (!contrasenaActual || !nuevaContrasena || !confirmarContrasena) {
      const mensaje = 'Todos los campos son obligatorios';
      if (Platform.OS === 'web') {
        window.alert(mensaje);
      } else {
        Alert.alert('Error', mensaje);
      }
      return;
    }

    if (nuevaContrasena !== confirmarContrasena) {
      const mensaje = 'Las contraseñas no coinciden';
      if (Platform.OS === 'web') {
        window.alert(mensaje);
      } else {
        Alert.alert('Error', mensaje);
      }
      return;
    }

    if (nuevaContrasena.length < 6) {
      const mensaje = 'La contraseña debe tener al menos 6 caracteres';
      if (Platform.OS === 'web') {
        window.alert(mensaje);
      } else {
        Alert.alert('Error', mensaje);
      }
      return;
    }

    setLoading(true);
    try {
      const hashBase64 = await hashPassword(nuevaContrasena);

      await api.put('Usuario/ActualizarContrasena', {
        usuarioId: usuario?.idUsuario ?? usuario?.id,
        nuevaContrasena: hashBase64,
      });

      const mensaje = 'Contraseña actualizada correctamente';
      if (Platform.OS === 'web') {
        window.alert(mensaje);
      } else {
        Alert.alert('Éxito', mensaje);
      }

      // Limpiar campos
      setContrasenaActual('');
      setNuevaContrasena('');
      setConfirmarContrasena('');

      // Volver atrás
      router.back();
    } catch (error: any) {
      logger.error('Error al cambiar contraseña:', error?.response?.status ?? error?.message);
      const mensaje = error?.response?.data?.message || 'No se pudo cambiar la contraseña';
      if (Platform.OS === 'web') {
        window.alert(mensaje);
      } else {
        Alert.alert('Error', mensaje);
      }
    } finally {
      setLoading(false);
    }
  };

  const ojo = (ver: boolean, cambiar: (v: boolean) => void) => (
    <Pressable
      onPress={() => cambiar(!ver)}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel={ver ? 'Ocultar contraseña' : 'Mostrar contraseña'}
    >
      <Icon name={ver ? 'eye-off-outline' : 'eye-outline'} size={22} color={tema.colores.textoTenue} />
    </Pressable>
  );

  return (
    <KeyboardAware>
      <View style={estilos.contenedor}>
        <View style={estilos.cabecera}>
          <View style={estilos.circulo}>
            <Icon name="lock-closed-outline" size={28} color={tema.colores.primarioTexto} />
          </View>
          <AppText variante="titulo">Cambiar contraseña</AppText>
          {usuario?.nombre ? <AppText tono="suave">{usuario.nombre}</AppText> : null}
        </View>

        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <Card>
            <Input
              label="Contraseña actual"
              leftIcon="key-outline"
              value={contrasenaActual}
              onChangeText={setContrasenaActual}
              secureTextEntry={!verActual}
              placeholder="Ingrese su contraseña actual"
              autoCapitalize="none"
              right={ojo(verActual, setVerActual)}
            />
            <Input
              label="Nueva contraseña"
              leftIcon="lock-closed-outline"
              value={nuevaContrasena}
              onChangeText={setNuevaContrasena}
              secureTextEntry={!verNueva}
              placeholder="Ingrese su nueva contraseña"
              autoCapitalize="none"
              helper="Mínimo 6 caracteres"
              right={ojo(verNueva, setVerNueva)}
            />
            <Input
              label="Confirmar nueva contraseña"
              leftIcon="checkmark-circle-outline"
              value={confirmarContrasena}
              onChangeText={setConfirmarContrasena}
              secureTextEntry={!verConfirmar}
              placeholder="Confirme su nueva contraseña"
              autoCapitalize="none"
              right={ojo(verConfirmar, setVerConfirmar)}
            />
            <Button title="Cambiar contraseña" onPress={handleCambiarContrasena} loading={loading} />
          </Card>
        </ScrollView>
      </View>
    </KeyboardAware>
  );
}
