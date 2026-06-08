import FormField from '@/components/FormField';
import PrimaryButton from '@/components/PrimaryButton';
import { COLORS, RADIUS, SPACING, commonStyles } from '@/constants/theme';
import { toDateInputValue } from '@/utils/formatters';
import { logger, showError, showSuccess } from '@/utils/logger';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { personaService } from '../../api/services';

export default function CrearPersona() {
  const router = useRouter();

  // Inicializa persona con fechaNacimiento actual, pero no muestres ni input ni texto
  const [persona, setPersona] = useState({
    nombre: '',
    apellido: '',
    cedula: '',
    residencia: '',
    email: '',
    edad: '',
    celular: '',
    fechaNacimiento: toDateInputValue(new Date()),
  });

  const [errores, setErrores] = useState<Partial<Record<keyof typeof persona, string>>>({});

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
  };

  const handleChange = (campo: keyof typeof persona, valor: string) => {
    setPersona((prev) => ({ ...prev, [campo]: valor }));
    const { regex, mensaje } = validaciones[campo];
    setErrores((prev) => ({
      ...prev,
      [campo]: valor === '' || regex.test(valor) ? '' : mensaje,
    }));
  };

  const guardar = async () => {
    const nuevosErrores: Partial<Record<keyof typeof persona, string>> = {};

    (Object.keys(persona) as (keyof typeof persona)[]).forEach((campo) => {
      const valor = persona[campo];
      const { regex, mensaje } = validaciones[campo];
      if (campo !== 'residencia' && (!valor || !regex.test(valor))) {
        nuevosErrores[campo] = mensaje;
      }
    });

    if (Object.keys(nuevosErrores).length > 0) {
      setErrores(nuevosErrores);
      Alert.alert('Error', 'Revisa los campos con errores');
      return;
    }

    try {
      await personaService.crear({
        ...persona,
        edad: parseInt(persona.edad),
        rol: "02",
      });

      showSuccess('Persona creada correctamente');
      router.back();
    } catch (error) {
      logger.error('Error al crear persona:', error);
      showError('No se pudo crear la persona');
    }
  };

  const campos: {
    key: keyof typeof persona;
    label: string;
    keyboardType?: any;
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

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
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

        <PrimaryButton title="Guardar" onPress={guardar} />
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
