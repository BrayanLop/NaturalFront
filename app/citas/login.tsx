import { COLORS, FONT_SIZE, FONT_WEIGHT, RADIUS, SHADOWS, SPACING, commonStyles } from '@/constants/theme';
import { useCitasAuth } from '@/context/citasAuthContext';
import { logger, showError } from '@/utils/logger';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { citasApi } from '../api/citasApi';
import { CitasMode, EmpresaCita } from '../api/modelos/citas';

export default function CitasLogin() {
  const router = useRouter();
  const { session, cargando, login } = useCitasAuth();

  const [empresas, setEmpresas] = useState<EmpresaCita[]>([]);
  const [cargandoEmpresas, setCargandoEmpresas] = useState(true);
  const [tenant, setTenant] = useState('');
  const [usuario, setUsuario] = useState('');
  const [mode, setMode] = useState<CitasMode>('cliente');
  const [loading, setLoading] = useState(false);

  // Redirigir si ya hay sesión activa.
  useEffect(() => {
    if (!cargando && session) {
      router.replace('/citas/home');
    }
  }, [cargando, session]);

  // Cargar empresas (endpoint anónimo) para el selector.
  useEffect(() => {
    const cargar = async () => {
      try {
        const { data } = await citasApi.get<EmpresaCita[]>('/Empresas');
        const activas = data.filter((e) => e.activo);
        setEmpresas(activas);
        if (activas.length > 0) setTenant(activas[0].id);
      } catch (error) {
        logger.warn('[Citas] No se pudieron cargar las empresas', error);
      } finally {
        setCargandoEmpresas(false);
      }
    };
    cargar();
  }, []);

  const handleLogin = async () => {
    if (!tenant.trim()) {
      showError('Selecciona o escribe el código de la empresa', 'Empresa requerida');
      return;
    }
    if (!usuario.trim()) {
      showError('Escribe tu nombre de usuario', 'Usuario requerido');
      return;
    }

    setLoading(true);
    try {
      const empresaNombre =
        empresas.find((e) => e.id === tenant)?.nombre || tenant;
      await login({ tenant: tenant.trim(), empresaNombre, usuario: usuario.trim(), mode });
      router.replace('/citas/home');
    } catch (error: any) {
      const mensaje =
        error?.response?.data ||
        error?.response?.data?.message ||
        'No se pudo iniciar sesión. Verifica la empresa e intenta nuevamente.';
      showError(typeof mensaje === 'string' ? mensaje : 'No se pudo iniciar sesión', 'Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.container}>
          <View style={styles.logoCircle}>
            <Ionicons name="calendar" size={48} color={COLORS.white} />
          </View>
          <Text style={styles.brand}>Módulo de Citas</Text>

          <View style={styles.formCard}>
            <Text style={styles.welcomeTitle}>Bienvenido</Text>
            <Text style={styles.welcomeSubtitle}>Ingresa para agendar o gestionar citas</Text>

            {/* Selector de modo */}
            <View style={styles.modeRow}>
              <Pressable
                style={[styles.modeButton, mode === 'cliente' && styles.modeButtonActive]}
                onPress={() => setMode('cliente')}
              >
                <Ionicons
                  name="person-outline"
                  size={18}
                  color={mode === 'cliente' ? COLORS.white : COLORS.primary}
                />
                <Text style={[styles.modeText, mode === 'cliente' && styles.modeTextActive]}>
                  Cliente
                </Text>
              </Pressable>
              <Pressable
                style={[styles.modeButton, mode === 'empresa' && styles.modeButtonActive]}
                onPress={() => setMode('empresa')}
              >
                <Ionicons
                  name="business-outline"
                  size={18}
                  color={mode === 'empresa' ? COLORS.white : COLORS.primary}
                />
                <Text style={[styles.modeText, mode === 'empresa' && styles.modeTextActive]}>
                  Empresa
                </Text>
              </Pressable>
            </View>

            {/* Selector de empresa */}
            <Text style={commonStyles.label}>Empresa</Text>
            {cargandoEmpresas ? (
              <View style={styles.loadingEmpresas}>
                <ActivityIndicator color={COLORS.primary} />
              </View>
            ) : empresas.length > 0 ? (
              <View style={styles.pickerWrapper}>
                <Picker selectedValue={tenant} onValueChange={(v) => setTenant(String(v))}>
                  {empresas.map((e) => (
                    <Picker.Item key={e.id} label={`${e.nombre} (${e.id})`} value={e.id} />
                  ))}
                </Picker>
              </View>
            ) : (
              <TextInput
                style={commonStyles.input}
                placeholder="Código de la empresa (ej: ACME)"
                value={tenant}
                onChangeText={setTenant}
                autoCapitalize="characters"
                placeholderTextColor={COLORS.textTertiary}
              />
            )}

            {/* Usuario */}
            <Text style={[commonStyles.label, { marginTop: SPACING.lg }]}>
              {mode === 'empresa' ? 'Usuario administrador' : 'Tu nombre'}
            </Text>
            <TextInput
              style={commonStyles.input}
              placeholder={mode === 'empresa' ? 'Ej: admin' : 'Ej: Juan Pérez'}
              value={usuario}
              onChangeText={setUsuario}
              autoCapitalize="words"
              placeholderTextColor={COLORS.textTertiary}
            />

            <Pressable
              style={({ pressed }) => [
                styles.button,
                !(tenant && usuario) && styles.buttonDisabled,
                pressed && styles.buttonPressed,
              ]}
              onPress={handleLogin}
              disabled={!(tenant && usuario) || loading}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.buttonText}>Ingresar</Text>
              )}
            </Pressable>

            <Pressable
              onPress={() => router.replace('/login')}
              style={({ pressed }) => [styles.backLink, pressed && { opacity: 0.7 }]}
            >
              <Ionicons name="arrow-back" size={16} color={COLORS.primary} />
              <Text style={styles.backLinkText}>Volver a Natural</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1 },
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: SPACING.lg,
    backgroundColor: COLORS.primary,
  },
  logoCircle: {
    alignSelf: 'center',
    width: 96,
    height: 96,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryDark,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  brand: {
    textAlign: 'center',
    color: COLORS.white,
    fontSize: FONT_SIZE.title1,
    fontWeight: FONT_WEIGHT.bold,
    marginBottom: SPACING.xl,
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
  modeRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.white,
  },
  modeButtonActive: {
    backgroundColor: COLORS.primary,
  },
  modeText: {
    color: COLORS.primary,
    fontWeight: FONT_WEIGHT.semibold,
    fontSize: FONT_SIZE.body,
  },
  modeTextActive: {
    color: COLORS.white,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    overflow: 'hidden',
  },
  loadingEmpresas: {
    height: 48,
    justifyContent: 'center',
  },
  button: {
    marginTop: SPACING.xl,
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
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.lg,
  },
  backLinkText: {
    color: COLORS.primary,
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
  },
});
