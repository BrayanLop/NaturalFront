import KeyboardAware from '@/components/KeyboardAware';
import { COLORS, FONT_SIZE, FONT_WEIGHT, RADIUS, SHADOWS, SPACING } from '@/constants/theme';
import { useAuth } from '@/context/authContext';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import * as Crypto from 'expo-crypto';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { api } from '../api/api';

export default function CambiarContrasena() {
  const { usuario } = useAuth();
  const router = useRouter();
  const [contrasenaActual, setContrasenaActual] = useState('');
  const [nuevaContrasena, setNuevaContrasena] = useState('');
  const [confirmarContrasena, setConfirmarContrasena] = useState('');
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
      // Convertir contraseña a bytes UTF-8
      const encoder = new TextEncoder();
      const passwordBytes = encoder.encode(nuevaContrasena);
      
      // Hashear con SHA256
      const hashBytes = await Crypto.digest(
        Crypto.CryptoDigestAlgorithm.SHA256,
        passwordBytes
      );
      
      // Convertir ArrayBuffer a Base64
      const hashBase64 = btoa(String.fromCharCode(...new Uint8Array(hashBytes)));

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
      console.error('❌ Error al cambiar contraseña:', error);
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

  return (
    <KeyboardAware>
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerIconContainer}>
          <FontAwesome5 name="lock" size={24} color={COLORS.primary} />
        </View>
        <Text style={styles.headerTitle}>Cambiar contraseña</Text>
        <Text style={styles.headerSubtitle}>{usuario?.nombre}</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Contraseña actual</Text>
            <View style={styles.inputContainer}>
              <FontAwesome5 name="key" size={16} color={COLORS.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={contrasenaActual}
                onChangeText={setContrasenaActual}
                secureTextEntry
                placeholder="Ingrese su contraseña actual"
                placeholderTextColor={COLORS.textTertiary}
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Nueva contraseña</Text>
            <View style={styles.inputContainer}>
              <FontAwesome5 name="lock" size={16} color={COLORS.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={nuevaContrasena}
                onChangeText={setNuevaContrasena}
                secureTextEntry
                placeholder="Ingrese su nueva contraseña"
                placeholderTextColor={COLORS.textTertiary}
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Confirmar nueva contraseña</Text>
            <View style={styles.inputContainer}>
              <FontAwesome5 name="check-circle" size={16} color={COLORS.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={confirmarContrasena}
                onChangeText={setConfirmarContrasena}
                secureTextEntry
                placeholder="Confirme su nueva contraseña"
                placeholderTextColor={COLORS.textTertiary}
                autoCapitalize="none"
              />
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.button,
              loading && styles.buttonDisabled,
              pressed && !loading && styles.buttonPressed,
            ]}
            onPress={handleCambiarContrasena}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.buttonText}>Cambiar contraseña</Text>
            )}
          </Pressable>

          <View style={styles.infoBox}>
            <FontAwesome5 name="info-circle" size={14} color={COLORS.warning} />
            <Text style={styles.infoText}>
              La contraseña debe tener al menos 6 caracteres
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
    </KeyboardAware>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: SPACING.lg,
    backgroundColor: COLORS.background,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
    paddingVertical: SPACING.lg,
  },
  headerIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primarySurface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  headerTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.md,
  },
  formGroup: {
    marginBottom: SPACING.lg,
  },
  label: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.white,
  },
  inputIcon: {
    paddingLeft: SPACING.md,
  },
  input: {
    flex: 1,
    padding: SPACING.md,
    fontSize: FONT_SIZE.md,
    color: COLORS.text,
  },
  button: {
    backgroundColor: COLORS.primary,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    marginTop: SPACING.sm,
    ...SHADOWS.primary,
  },
  buttonPressed: {
    backgroundColor: COLORS.primaryDark,
    transform: [{ scale: 0.98 }],
  },
  buttonDisabled: {
    backgroundColor: COLORS.border,
    ...SHADOWS.none,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.warningLight,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginTop: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.warning,
  },
  infoText: {
    flex: 1,
    fontSize: FONT_SIZE.sm,
    color: COLORS.text,
    lineHeight: 18,
  },
});
