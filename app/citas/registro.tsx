import { mensajeErrorCitas } from '@/app/api/citasApi';
import FormField from '@/components/FormField';
import KeyboardAware from '@/components/KeyboardAware';
import PrimaryButton from '@/components/PrimaryButton';
import { COLORS, commonStyles, FONT_SIZE, SPACING } from '@/constants/theme';
import { useCitasAuth } from '@/context/citasAuthContext';
import { showError } from '@/utils/logger';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput } from 'react-native';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Registro de cliente externo (POST /Auth/register). La contraseña se envía tal cual por HTTPS:
 * el backend de Citas la hashea (IPasswordHasher). No se usa el SHA-256 del login de Natural.
 */
export default function RegistroCliente() {
  const { registrar } = useCitasAuth();
  const [form, setForm] = useState({ nombre: '', apellido: '', email: '', celular: '', password: '', confirmar: '' });
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [enviando, setEnviando] = useState(false);

  const set = (campo: keyof typeof form) => (valor: string) => setForm((f) => ({ ...f, [campo]: valor }));

  const enviar = async () => {
    const e: Record<string, string> = {};
    if (!form.nombre.trim()) e.nombre = 'El nombre es obligatorio.';
    if (!EMAIL_REGEX.test(form.email.trim())) e.email = 'Escribe un correo válido.';
    if (form.celular && !/^\d{7,15}$/.test(form.celular.trim())) e.celular = 'Solo números (7 a 15 dígitos).';
    if (form.password.length < 6) e.password = 'Mínimo 6 caracteres.';
    if (form.password !== form.confirmar) e.confirmar = 'Las contraseñas no coinciden.';
    setErrores(e);
    if (Object.keys(e).length > 0) return;

    setEnviando(true);
    try {
      await registrar({
        nombre: form.nombre.trim(),
        apellido: form.apellido.trim(),
        email: form.email.trim(),
        celular: form.celular.trim() || null,
        password: form.password,
      });
      // El layout redirige a la elección de empresa.
    } catch (err) {
      showError(mensajeErrorCitas(err, 'No se pudo crear la cuenta.'));
    } finally {
      setEnviando(false);
    }
  };

  const campo = (
    clave: keyof typeof form,
    label: string,
    props: Partial<React.ComponentProps<typeof TextInput>> = {}
  ) => (
    <FormField label={label} error={errores[clave]}>
      <TextInput
        style={commonStyles.input}
        value={form[clave]}
        onChangeText={set(clave)}
        placeholderTextColor={COLORS.placeholder}
        {...props}
      />
    </FormField>
  );

  return (
    <KeyboardAware>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.ayuda}>Crea tu cuenta para agendar citas en las empresas disponibles.</Text>
        {campo('nombre', 'Nombre', { autoCapitalize: 'words' })}
        {campo('apellido', 'Apellido (opcional)', { autoCapitalize: 'words' })}
        {campo('email', 'Correo electrónico', { autoCapitalize: 'none', autoCorrect: false, keyboardType: 'email-address' })}
        {campo('celular', 'Celular (opcional)', { keyboardType: 'phone-pad', maxLength: 15 })}
        {campo('password', 'Contraseña', { secureTextEntry: true })}
        {campo('confirmar', 'Confirmar contraseña', { secureTextEntry: true })}
        <PrimaryButton title="Crear cuenta" onPress={enviar} loading={enviando} disabled={enviando} fullWidth />
      </ScrollView>
    </KeyboardAware>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: SPACING.lg, paddingBottom: SPACING.huge },
  ayuda: { fontSize: FONT_SIZE.body, color: COLORS.textSecondary, marginBottom: SPACING.lg },
});
