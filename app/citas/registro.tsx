import { mensajeErrorCitas } from '@/app/api/citasApi';
import { Button, Input, type InputProps } from '@/components/ds';
import KeyboardAware from '@/components/KeyboardAware';
import { useCitasAuth } from '@/context/citasAuthContext';
import { FONT_SIZE, SPACING, useEstilos, type Tema } from '@/theme';
import { showError } from '@/utils/logger';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const crearEstilos = (t: Tema) =>
  StyleSheet.create({
    scroll: { padding: SPACING.lg, paddingBottom: SPACING.huge },
    ayuda: { fontSize: FONT_SIZE.callout, color: t.colores.textoSuave, marginBottom: SPACING.lg },
  });

/**
 * Registro de cliente externo (POST /Auth/register). La contraseña se envía tal cual por HTTPS:
 * el backend de Citas la hashea (IPasswordHasher). No se usa el SHA-256 del login de Natural.
 */
export default function RegistroCliente() {
  const estilos = useEstilos(crearEstilos);
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

  const campo = (clave: keyof typeof form, label: string, props: Partial<InputProps> = {}) => (
    <Input label={label} error={errores[clave]} value={form[clave]} onChangeText={set(clave)} {...props} />
  );

  return (
    <KeyboardAware>
      <ScrollView contentContainerStyle={estilos.scroll} keyboardShouldPersistTaps="handled">
        <Text style={estilos.ayuda}>Crea tu cuenta para agendar citas en las empresas disponibles.</Text>
        {campo('nombre', 'Nombre', { autoCapitalize: 'words' })}
        {campo('apellido', 'Apellido (opcional)', { autoCapitalize: 'words' })}
        {campo('email', 'Correo electrónico', { autoCapitalize: 'none', autoCorrect: false, keyboardType: 'email-address' })}
        {campo('celular', 'Celular (opcional)', { keyboardType: 'phone-pad', maxLength: 15 })}
        {campo('password', 'Contraseña', { secureTextEntry: true })}
        {campo('confirmar', 'Confirmar contraseña', { secureTextEntry: true })}
        <Button title="Crear cuenta" onPress={enviar} loading={enviando} disabled={enviando} fullWidth />
      </ScrollView>
    </KeyboardAware>
  );
}
