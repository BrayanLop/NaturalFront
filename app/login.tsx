import { showError } from '@/utils/logger';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Crypto from 'expo-crypto';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import { COLORS, FONT_SIZE, FONT_WEIGHT, RADIUS, SHADOWS, SPACING } from '../constants/theme';
import { useAuth } from '../context/authContext';
import { api } from './api/api';

export default function Login() {
  const { login, usuario, cargando } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState('');

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  const passwordRef = useRef<TextInput>(null);

  // Redirigir si ya hay sesión
  useEffect(() => {
    if (!cargando && usuario) {
      router.replace('/home');
    }
  }, [cargando, usuario]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleLogin = async () => {
    if (!email || !password) return;

    setLoading(true);
    try {
      // Convertir contraseña a bytes UTF-8
      const encoder = new TextEncoder();
      const passwordBytes = encoder.encode(password);
      
      // Hashear con SHA256
      const hashBytes = await Crypto.digest(
        Crypto.CryptoDigestAlgorithm.SHA256,
        passwordBytes
      );
      
      // Convertir ArrayBuffer a Base64
      const hashBase64 = btoa(String.fromCharCode(...new Uint8Array(hashBytes)));

      console.log('Hash generado:', hashBase64); // Para debug

      const res = await api.post('/Login/Autenticar', {
        Email: email,
        Password: hashBase64,
      });

      // El backend devuelve: { token, expiraEn, persona: { id, idUsuario, nombre, empresaId, rol, nombreEmpresa } }
      const datosUsuario = {
        id: res.data.persona.id,
        idUsuario: res.data.persona.idUsuario, // Nuevo campo
        nombre: res.data.persona.nombre,
        empresaId: res.data.persona.empresaId,
        rol: res.data.persona.rol,
        nombreEmpresa: res.data.persona.nombreEmpresa,
        token: res.data.token // ← Token JWT del backend
      };

      console.log('Datos del login:', res.data);
      console.log('Nombre empresa:', res.data.persona.nombreEmpresa); // Para debug

      await login(datosUsuario);
      router.replace('/home');
    } catch (error: any) {
      // Mensaje de error genérico para cualquier problema de login
      const mensaje = error?.response?.data?.message || 
                      'No se pudo iniciar sesión. Verifica tus credenciales e intenta nuevamente.';
      showError(mensaje, 'Error de inicio de sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
          <Animated.View style={[styles.logoContainer, { transform: [{ scale: scaleAnim }] }]}>
            <Image
              source={require('../assets/images/logo1.png')}
              style={styles.logo}
            />
          </Animated.View>

          <View style={styles.formCard}>
            <Text style={styles.welcomeTitle}>Bienvenido</Text>
            <Text style={styles.welcomeSubtitle}>Inicia sesión para continuar</Text>

            <View style={styles.inputContainer}>
              <Ionicons 
                name="person-outline" 
                size={20} 
                color={focusedInput === 'email' ? COLORS.primary : COLORS.textTertiary} 
                style={styles.inputIcon}
              />
              <TextInput
                style={[
                  styles.input,
                  focusedInput === 'email' && styles.inputFocused,
                ]}
                placeholder="Usuario"
                value={email}
                onChangeText={setEmail}
                onFocus={() => setFocusedInput('email')}
                onBlur={() => setFocusedInput('')}
                placeholderTextColor={COLORS.textTertiary}
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
                autoCapitalize="none"
              />
            </View>

            <View style={[
              styles.passwordContainer,
              focusedInput === 'password' && styles.passwordContainerFocused,
            ]}>
              <Ionicons 
                name="lock-closed-outline" 
                size={20} 
                color={focusedInput === 'password' ? COLORS.primary : COLORS.textTertiary} 
                style={styles.inputIcon}
              />
              <TextInput
                ref={passwordRef}
                style={styles.passwordInput}
                placeholder="Contraseña"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                onFocus={() => setFocusedInput('password')}
                onBlur={() => setFocusedInput('')}
                placeholderTextColor={COLORS.textTertiary}
                returnKeyType="done"
              />
              <Pressable 
                onPress={() => setShowPassword(!showPassword)}
                hitSlop={8}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={22}
                  color={COLORS.textTertiary}
                />
              </Pressable>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.button,
                !(email && password) && styles.buttonDisabled,
                pressed && styles.buttonPressed,
              ]}
              onPress={handleLogin}
              disabled={!(email && password) || loading}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.buttonText}>Ingresar</Text>
              )}
            </Pressable>

            <Pressable 
              onPress={() => alert('Recuperación no implementada')}
              style={({ pressed }) => [
                styles.forgotPasswordContainer,
                pressed && { opacity: 0.7 }
              ]}
            >
              <Text style={styles.forgotPassword}>¿Olvidaste tu contraseña?</Text>
            </Pressable>
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: SPACING.lg,
    backgroundColor: COLORS.primary,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  logo: {
    width: 180,
    height: 180,
    resizeMode: 'contain',
  },
  formCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    ...SHADOWS.lg,
  },
  welcomeTitle: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  welcomeSubtitle: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.md,
  },
  inputIcon: {
    marginRight: SPACING.sm,
  },
  input: {
    flex: 1,
    paddingVertical: SPACING.md,
    fontSize: FONT_SIZE.md,
    color: COLORS.text,
  },
  inputFocused: {
    borderColor: COLORS.primary,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.lg,
    paddingHorizontal: SPACING.md,
  },
  passwordContainerFocused: {
    borderColor: COLORS.primary,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: SPACING.md,
    fontSize: FONT_SIZE.md,
    color: COLORS.text,
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md + 2,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
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
    fontWeight: FONT_WEIGHT.semibold,
    fontSize: FONT_SIZE.md,
  },
  forgotPasswordContainer: {
    marginTop: SPACING.lg,
    alignItems: 'center',
  },
  forgotPassword: {
    color: COLORS.primary,
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
  },
});
