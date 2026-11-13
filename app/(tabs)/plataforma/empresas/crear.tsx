import { Button, Card, Input, SectionHeader, type InputProps } from '@/components/ds';
import KeyboardAware from '@/components/KeyboardAware';
import { SPACING, useEstilos, type Tema } from '@/theme';
import { mensajeDeError } from '@/utils/apiError';
import { logger, showError, showSuccess } from '@/utils/logger';
import { hashPassword } from '@/utils/password';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView } from 'react-native';
import { CrearEmpresaRequest } from '../../../api/modelos/empresaPlataforma';
import { plataformaApi } from '../../../api/plataformaApi';

type Campo =
  | 'nombre' | 'nit' | 'direccion' | 'telefono'
  | 'adminNombre' | 'adminApellido' | 'adminCedula' | 'adminEmail' | 'adminCelular'
  | 'adminUsuario' | 'adminContrasena';

const VACIO: Record<Campo, string> = {
  nombre: '', nit: '', direccion: '', telefono: '',
  adminNombre: '', adminApellido: '', adminCedula: '', adminEmail: '', adminCelular: '',
  adminUsuario: '', adminContrasena: '',
};

// Mismas reglas que valida Brar/Natural (el servidor las repite).
const REGLAS: Partial<Record<Campo, { ok: (v: string) => boolean; mensaje: string }>> = {
  nombre: { ok: (v) => v.trim().length >= 2 && v.trim().length <= 100, mensaje: 'Obligatorio (2–100 caracteres)' },
  nit: { ok: (v) => v.trim().length <= 20, mensaje: 'Máximo 20 caracteres' },
  telefono: { ok: (v) => v.trim().length <= 20, mensaje: 'Máximo 20 caracteres' },
  direccion: { ok: (v) => v.trim().length <= 200, mensaje: 'Máximo 200 caracteres' },
  adminNombre: { ok: (v) => v.trim().length > 0, mensaje: 'Obligatorio' },
  adminApellido: { ok: (v) => v.trim().length > 0, mensaje: 'Obligatorio' },
  adminCedula: { ok: (v) => /^\d{6,10}$/.test(v), mensaje: 'Cédula inválida (6-10 dígitos)' },
  adminEmail: { ok: (v) => /^[\w.-]+@[\w.-]+\.\w+$/.test(v), mensaje: 'Correo inválido' },
  adminCelular: { ok: (v) => /^\d{10}$/.test(v), mensaje: 'Celular inválido (10 dígitos)' },
  adminUsuario: { ok: (v) => /^\S{3,50}$/.test(v.trim()), mensaje: 'Entre 3 y 50 caracteres, sin espacios' },
  adminContrasena: { ok: (v) => v.length >= 6, mensaje: 'Mínimo 6 caracteres' },
};

const crearEstilos = (t: Tema) => ({
  container: { padding: SPACING.lg, backgroundColor: t.colores.fondo, flexGrow: 1 },
});

export default function CrearEmpresa() {
  const router = useRouter();
  const estilos = useEstilos(crearEstilos);
  const [valores, setValores] = useState<Record<Campo, string>>(VACIO);
  const [errores, setErrores] = useState<Partial<Record<Campo, string>>>({});
  const [guardando, setGuardando] = useState(false);

  const cambiar = (campo: Campo, valor: string) => {
    setValores((prev) => ({ ...prev, [campo]: valor }));
    const regla = REGLAS[campo];
    setErrores((prev) => ({ ...prev, [campo]: valor === '' || !regla || regla.ok(valor) ? '' : regla.mensaje }));
  };

  const campo = (key: Campo, label: string, extra?: Partial<InputProps>) => (
    <Input
      key={key}
      label={label}
      value={valores[key]}
      onChangeText={(t) => cambiar(key, t)}
      error={errores[key] || undefined}
      placeholder={label}
      {...extra}
    />
  );

  const guardar = async () => {
    const nuevos: Partial<Record<Campo, string>> = {};
    (Object.keys(REGLAS) as Campo[]).forEach((k) => {
      const opcional = ['nit', 'direccion', 'telefono'].includes(k);
      if (opcional && valores[k] === '') return;
      if (!REGLAS[k]!.ok(valores[k])) nuevos[k] = REGLAS[k]!.mensaje;
    });
    if (Object.keys(nuevos).length > 0) {
      setErrores(nuevos);
      showError('Revisa los campos con errores');
      return;
    }

    setGuardando(true);
    try {
      const cuerpo: CrearEmpresaRequest = {
        nombre: valores.nombre.trim(),
        nit: valores.nit.trim() || undefined,
        direccion: valores.direccion.trim() || undefined,
        telefono: valores.telefono.trim() || undefined,
        admin: {
          nombre: valores.adminNombre.trim(),
          apellido: valores.adminApellido.trim(),
          cedula: valores.adminCedula,
          email: valores.adminEmail,
          celular: valores.adminCelular,
          nombreUsuario: valores.adminUsuario.trim(),
          contrasena: await hashPassword(valores.adminContrasena),
        },
      };
      await plataformaApi.post('/Empresas', cuerpo);
      showSuccess('Empresa creada. Su administrador ya puede iniciar sesión.');
      router.back();
    } catch (error) {
      logger.error('Error al crear empresa:', error);
      showError(mensajeDeError(error, 'No se pudo crear la empresa'));
    } finally {
      setGuardando(false);
    }
  };

  return (
    <KeyboardAware>
      <ScrollView contentContainerStyle={estilos.container} keyboardShouldPersistTaps="handled">
        <Card>
          <SectionHeader title="Empresa" icon="business-outline" style={{ marginTop: 0 }} />
          {campo('nombre', 'Nombre')}
          {campo('nit', 'NIT (opcional)')}
          {campo('direccion', 'Dirección (opcional)')}
          {campo('telefono', 'Teléfono (opcional)', { keyboardType: 'phone-pad' })}
        </Card>

        <Card>
          <SectionHeader title="Administrador de la empresa" icon="person-outline" style={{ marginTop: 0 }} />
          {campo('adminNombre', 'Nombre')}
          {campo('adminApellido', 'Apellido')}
          {campo('adminCedula', 'Cédula', { keyboardType: 'numeric' })}
          {campo('adminEmail', 'Correo electrónico', { keyboardType: 'email-address', autoCapitalize: 'none' })}
          {campo('adminCelular', 'Celular', { keyboardType: 'numeric' })}
          {campo('adminUsuario', 'Usuario', { autoCapitalize: 'none', autoCorrect: false })}
          {campo('adminContrasena', 'Contraseña inicial', { secureTextEntry: true, autoCapitalize: 'none' })}
        </Card>

        <Button title="Crear empresa" icon="checkmark" onPress={guardar} loading={guardando} />
      </ScrollView>
    </KeyboardAware>
  );
}
