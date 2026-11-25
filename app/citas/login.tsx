import { mensajeErrorCitas } from '@/app/api/citasApi';
import { Button, Card, Input } from '@/components/ds';
import KeyboardAware from '@/components/KeyboardAware';
import { useCitasAuth } from '@/context/citasAuthContext';
import { FONT_SIZE, FONT_WEIGHT, SPACING, useEstilos, type Tema } from '@/theme';
import { showError } from '@/utils/logger';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

const crearEstilos = (t: Tema) =>
  StyleSheet.create({
    container: { flexGrow: 1, justifyContent: 'center', padding: SPACING.lg, backgroundColor: t.colores.primarioFuerte },
    titulo: { fontSize: FONT_SIZE.title1, fontWeight: FONT_WEIGHT.bold, color: t.colores.texto, textAlign: 'center' },
    subtitulo: { fontSize: FONT_SIZE.callout, color: t.colores.textoSuave, textAlign: 'center', marginBottom: SPACING.xl, marginTop: SPACING.xs },
    enlaceBox: { alignItems: 'center', justifyContent: 'center', minHeight: 44, marginTop: SPACING.md },
    enlace: { color: t.colores.primarioTexto, fontSize: FONT_SIZE.callout, fontWeight: FONT_WEIGHT.semibold },
    volver: { color: t.colores.sobrePrimario, fontSize: FONT_SIZE.callout, fontWeight: FONT_WEIGHT.medium },
  });

/** Login de clientes externos (correo + contraseña de su cuenta de Citas). */
export default function LoginCliente() {
  const estilos = useEstilos(crearEstilos);
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
      <ScrollView contentContainerStyle={estilos.container} keyboardShouldPersistTaps="handled">
        <Card padding={SPACING.xl}>
          <Text style={estilos.titulo}>Agenda tu cita</Text>
          <Text style={estilos.subtitulo}>Inicia sesión con tu cuenta de cliente</Text>

          <Input
            label="Correo electrónico"
            leftIcon="mail-outline"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            placeholder="tu@correo.com"
          />
          <Input
            label="Contraseña"
            leftIcon="lock-closed-outline"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="Tu contraseña"
            onSubmitEditing={ingresar}
          />

          <Button title="Ingresar" onPress={ingresar} loading={enviando} disabled={enviando} fullWidth />

          <Pressable onPress={() => router.push('/citas/registro')} style={estilos.enlaceBox}>
            <Text style={estilos.enlace}>¿No tienes cuenta? Regístrate</Text>
          </Pressable>
        </Card>

        <Pressable onPress={() => router.replace('/login')} style={estilos.enlaceBox}>
          <Text style={estilos.volver}>Soy parte del personal · Volver</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAware>
  );
}
