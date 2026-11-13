import { Button, Icon, Input } from '@/components/ds';
import { FONT_SIZE, FONT_WEIGHT, RADIUS, SPACING, sombra, useEstilos, useTheme, type Tema } from '@/theme';
import { showError } from '@/utils/logger';
import { hashPassword } from '@/utils/password';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useAuth } from '../context/authContext';
import { api } from './api/api';

export default function Login() {
  const { login, loginDemo, usuario, cargando } = useAuth();
  const router = useRouter();
  const { tema } = useTheme();
  const estilos = useEstilos(crearEstilos);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingDemo, setLoadingDemo] = useState(false);

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
      const hashBase64 = await hashPassword(password);

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

  const handleDemoLogin = async () => {
    setLoadingDemo(true);
    try {
      await loginDemo();
      router.replace('/home');
    } catch (error) {
      showError('Error al iniciar la demo', 'Error');
    } finally {
      setLoadingDemo(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <Animated.View style={[estilos.container, { opacity: fadeAnim }]}>
          <Animated.View style={[estilos.logoContainer, { transform: [{ scale: scaleAnim }] }]}>
            <Image
              source={require('../assets/images/logo1.png')}
              style={estilos.logo}
            />
          </Animated.View>

          <View style={estilos.formCard}>
            <Text style={estilos.welcomeTitle}>Bienvenido</Text>
            <Text style={estilos.welcomeSubtitle}>Inicia sesión para continuar</Text>

            <Input
              placeholder="Usuario"
              leftIcon="person-outline"
              value={email}
              onChangeText={setEmail}
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
              autoCapitalize="none"
              containerStyle={estilos.campo}
            />

            <Input
              ref={passwordRef}
              placeholder="Contraseña"
              leftIcon="lock-closed-outline"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              returnKeyType="done"
              containerStyle={estilos.campo}
              right={
                <Pressable
                  onPress={() => setShowPassword(!showPassword)}
                  hitSlop={10}
                  accessibilityRole="button"
                  accessibilityLabel={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  <Icon
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={22}
                    color={tema.colores.textoTenue}
                  />
                </Pressable>
              }
            />

            <Button
              title="Ingresar"
              onPress={handleLogin}
              loading={loading}
              disabled={!(email && password)}
              size="lg"
            />

            <View style={estilos.olvido}>
              <Button
                title="¿Olvidaste tu contraseña?"
                variant="ghost"
                size="sm"
                fullWidth={false}
                align="center"
                onPress={() => alert('Recuperación no implementada')}
              />
            </View>

            {/* Separador */}
            <View style={estilos.separatorContainer}>
              <View style={estilos.separatorLine} />
              <Text style={estilos.separatorText}>o</Text>
              <View style={estilos.separatorLine} />
            </View>

            {/* Acceso a la demo */}
            <Button
              title="Iniciar Demo"
              icon="rocket-outline"
              variant="secondary"
              size="lg"
              onPress={handleDemoLogin}
              loading={loadingDemo}
              disabled={loading}
            />

            <Text style={estilos.demoDescription}>
              Explora la app con datos de ejemplo. No se guarda nada.
            </Text>
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const crearEstilos = (t: Tema) => ({
  container: {
    flex: 1,
    justifyContent: 'center' as const,
    padding: SPACING.lg,
    backgroundColor: t.colores.encabezado,
  },
  logoContainer: {
    alignItems: 'center' as const,
    marginBottom: SPACING.xl,
  },
  logo: {
    width: 180,
    height: 180,
    resizeMode: 'contain' as const,
    // En oscuro el logo (verde oscuro) se perdería sobre el fondo: se tiñe con el verde claro del tema.
    ...(t.esOscuro ? { tintColor: t.colores.primarioTexto } : null),
  },
  formCard: {
    backgroundColor: t.colores.superficie,
    borderRadius: RADIUS.xxl,
    padding: SPACING.xl,
    ...sombra(t, 'lg'),
  },
  welcomeTitle: {
    fontSize: FONT_SIZE.title1,
    fontWeight: FONT_WEIGHT.bold,
    color: t.colores.texto,
    textAlign: 'center' as const,
    marginBottom: SPACING.xs,
  },
  welcomeSubtitle: {
    fontSize: FONT_SIZE.callout,
    color: t.colores.textoSuave,
    textAlign: 'center' as const,
    marginBottom: SPACING.xl,
  },
  campo: {
    marginBottom: SPACING.md,
  },
  olvido: {
    marginTop: SPACING.md,
    alignItems: 'center' as const,
  },
  separatorContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginVertical: SPACING.lg,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: t.colores.divisor,
  },
  separatorText: {
    marginHorizontal: SPACING.md,
    color: t.colores.textoTenue,
    fontSize: FONT_SIZE.sm,
  },
  demoDescription: {
    marginTop: SPACING.md,
    textAlign: 'center' as const,
    color: t.colores.textoSuave,
    fontSize: FONT_SIZE.footnote,
    lineHeight: 17,
  },
});
