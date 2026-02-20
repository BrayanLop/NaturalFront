import FormField from '@/components/FormField';
import LoadingView from '@/components/LoadingView';
import PrimaryButton from '@/components/PrimaryButton';
import { COLORS, RADIUS, SPACING, commonStyles } from '@/constants/theme';
import { toDateInputValue } from '@/utils/formatters';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    Alert,
    KeyboardTypeOptions,
    ScrollView,
    StyleSheet,
    TextInput,
    View
} from 'react-native';
import { api } from '../../api/api';

export default function EditarPersona() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [persona, setPersona] = useState({
    nombre: '',
    apellido: '',
    cedula: '',
    residencia: '',
    email: '',
    edad: '',
    celular: '',
    fechaNacimiento: '',
    rol: '', // ✅ Campo oculto
  });

  const [errores, setErrores] = useState<Partial<Record<keyof typeof persona, string>>>({});
  const [loading, setLoading] = useState(true);

  const validaciones: Record<keyof typeof persona, { regex: RegExp; mensaje: string }> = {
    nombre: { regex: /^[A-Za-zÁÉÍÓÚáéíóúñÑ\s]{3,}$/, mensaje: 'Nombre inválido' },
    apellido: { regex: /^[A-Za-zÁÉÍÓÚáéíóúñÑ\s]{3,}$/, mensaje: 'Apellido inválido' },
    cedula: { regex: /^\d{6,10}$/, mensaje: 'Cédula inválida (6-10 dígitos)' },
    residencia: { regex: /^.{0,100}$/, mensaje: '' },
    email: { regex: /^[\w.-]+@[\w.-]+\.\w+$/, mensaje: 'Correo inválido' },
    edad: { regex: /^\d{1,3}$/, mensaje: 'Edad inválida' },
    celular: { regex: /^\d{10}$/, mensaje: 'Celular inválido (10 dígitos)' },
    fechaNacimiento: {
      regex: /^\d{4}-\d{2}-\d{2}$/,
      mensaje: 'Fecha inválida (formato YYYY-MM-DD)',
    },
    rol: { regex: /^.{0,10}$/, mensaje: '' }, // no visible, pero se mantiene
  };

  const handleChange = (campo: keyof typeof persona, valor: string) => {
    setPersona((prev) => ({ ...prev, [campo]: valor }));
    const { regex, mensaje } = validaciones[campo];
    setErrores((prev) => ({
      ...prev,
      [campo]: valor === '' || regex.test(valor) ? '' : mensaje,
    }));
  };

  // Al cargar persona, si no hay fechaNacimiento, asigna la fecha actual, pero no muestres ni input ni texto
  const cargarPersona = async () => {
    try {
      const res = await api.get(`/Persona/Obtener/${id}`);
      const data = res.data;
      setPersona({
        nombre: data.nombre || '',
        apellido: data.apellido || '',
        cedula: data.cedula || '',
        residencia: data.residencia || '',
        email: data.email || '',
        edad: data.edad?.toString() || '',
        celular: data.celular || '',
        fechaNacimiento: data.fechaNacimiento?.split('T')[0] || toDateInputValue(new Date()),
        rol: data.rol || '02', // ✅ Valor que viene o se mantiene
      });
    } catch (err) {
      Alert.alert('Error', 'No se pudo cargar la persona');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarPersona();
  }, [id]);

  const guardarCambios = async () => {
    const nuevosErrores: Partial<Record<keyof typeof persona, string>> = {};

    (Object.keys(persona) as (keyof typeof persona)[]).forEach((campo) => {
      const valor = persona[campo];
      const { regex, mensaje } = validaciones[campo];
      if (!valor && campo !== 'residencia' && campo !== 'rol') {
        nuevosErrores[campo] = mensaje;
      }
    });

    if (Object.keys(nuevosErrores).length > 0) {
      setErrores(nuevosErrores);
      Alert.alert('Error', 'Revisa los campos con errores');
      return;
    }

    try {
      await api.put(
        `/Persona/Actualizar/${id}`,
        {
          ...persona,
          edad: parseInt(persona.edad),
          empresa: {}, // Se envía el objeto empresa vacío
        }
      );
      Alert.alert('Éxito', 'Persona actualizada correctamente');
      router.back();
    } catch (err) {
      Alert.alert('Error', 'No se pudo actualizar la persona');
    }
  };

  const campos: {
    key: keyof typeof persona;
    label: string;
    keyboardType?: KeyboardTypeOptions;
    isDate?: boolean;
  }[] = [
    { key: 'nombre', label: 'Nombre' },
    { key: 'apellido', label: 'Apellido' },
    { key: 'cedula', label: 'Cédula', keyboardType: 'numeric' },
    { key: 'residencia', label: 'Residencia' },
    { key: 'email', label: 'Correo electrónico', keyboardType: 'email-address' },
    { key: 'edad', label: 'Edad', keyboardType: 'numeric' },
    { key: 'celular', label: 'Celular', keyboardType: 'numeric' },
  ];

  if (loading) {
    return <LoadingView message="Cargando información..." />;
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.formCard}>
        {campos.map(({ key, label, keyboardType, isDate }) => (
          <FormField key={key} label={label} error={errores[key]}>
            <TextInput
              value={persona[key]}
              onChangeText={(text) => handleChange(key, text)}
              style={[commonStyles.input, errores[key] && styles.inputError]}
              placeholder={label}
              keyboardType={keyboardType}
              placeholderTextColor={COLORS.textTertiary}
            />
          </FormField>
        ))}

        {/* ✅ Campo oculto, no visible */}
        <View style={{ display: 'none' }}>
          <TextInput value={persona.rol} onChangeText={(text) => handleChange('rol', text)} />
        </View>

        <PrimaryButton title="Guardar" onPress={guardarCambios} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: SPACING.lg,
    backgroundColor: COLORS.background,
    flexGrow: 1,
  },
  formCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
  },
  inputError: {
    borderColor: COLORS.error,
  },
});
