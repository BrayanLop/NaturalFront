import { mensajeErrorCitas } from '@/app/api/citasApi';
import FormField from '@/components/FormField';
import KeyboardAware from '@/components/KeyboardAware';
import PrimaryButton from '@/components/PrimaryButton';
import { COLORS, commonStyles, FONT_SIZE, FONT_WEIGHT, RADIUS, SHADOWS, SPACING } from '@/constants/theme';
import { useCitasAuth } from '@/context/citasAuthContext';
import { showError } from '@/utils/logger';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

/** Login de clientes externos (correo + contraseña de su cuenta de Citas). */
export default function LoginCliente() {
  const { login } = useCitasAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [enviando, setEnviando] = useState(false);

  const ingresar = async () => {
    if (!email.trim() || !password) {
      showError('Escribe tu correo y tu contraseña.');
      return;
    }
    setEnviando(true);
    try {
      // El backend de Citas recibe la contraseña y la verifica con su propio hash.
      await login({ email: email.trim(), password });
      // El layout redirige a la elección de empresa.
    } catch (e: any) {
      showError(
        e?.response?.status === 401 ? 'Correo o contraseña incorrectos.' : mensajeErrorCitas(e, 'No se pudo iniciar sesión.')
      );
    } finally {
      setEnviando(false);
    }
  };

  return (
    <KeyboardAware>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.titulo}>Agenda tu cita</Text>
          <Text style={styles.subtitulo}>Inicia sesión con tu cuenta de cliente</Text>

          <FormField label="Correo electrónico">
            <TextInput
              style={commonStyles.input}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              placeholder="tu@correo.com"
              placeholderTextColor={COLORS.placeholder}
            />
          </FormField>
          <FormField label="Contraseña">
            <TextInput
              style={commonStyles.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="Tu contraseña"
              placeholderTextColor={COLORS.placeholder}
              onSubmitEditing={ingresar}
            />
          </FormField>

          <PrimaryButton title="Ingresar" onPress={ingresar} loading={enviando} disabled={enviando} fullWidth />

          <Pressable onPress={() => router.push('/citas/registro')} style={styles.enlaceBox}>
            <Text style={styles.enlace}>¿No tienes cuenta? Regístrate</Text>
          </Pressable>
        </View>

        <Pressable onPress={() => router.replace('/login')} style={styles.enlaceBox}>
          <Text style={styles.volver}>Soy parte del personal · Volver</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAware>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', padding: SPACING.lg, backgroundColor: COLORS.primary },
  card: { backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, padding: SPACING.xl, ...SHADOWS.lg },
  titulo: { fontSize: FONT_SIZE.title1, fontWeight: FONT_WEIGHT.bold, color: COLORS.text, textAlign: 'center' },
  subtitulo: { fontSize: FONT_SIZE.body, color: COLORS.textSecondary, textAlign: 'center', marginBottom: SPACING.xl, marginTop: SPACING.xs },
  enlaceBox: { alignItems: 'center', marginTop: SPACING.lg },
  enlace: { color: COLORS.primary, fontSize: FONT_SIZE.body, fontWeight: FONT_WEIGHT.semibold },
  volver: { color: COLORS.white, fontSize: FONT_SIZE.body, fontWeight: FONT_WEIGHT.medium },
});
