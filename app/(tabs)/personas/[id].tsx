import LoadingView from '@/components/LoadingView';
import { toDateInputValue } from '@/utils/formatters';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardTypeOptions,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
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
    return <LoadingView />;
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {campos.map(({ key, label, keyboardType, isDate }) => (
        <View key={key} style={styles.fieldContainer}>
          <Text style={styles.label}>{label}</Text>

          <TextInput
            value={persona[key]}
            onChangeText={(text) => handleChange(key, text)}
            style={[styles.input, errores[key] && styles.inputError]}
            placeholder={label}
            keyboardType={keyboardType}
          />

          {errores[key] ? <Text style={styles.errorText}>{errores[key]}</Text> : null}
        </View>
      ))}

      {/* ✅ Campo oculto, no visible */}
      <View style={{ display: 'none' }}>
        <TextInput value={persona.rol} onChangeText={(text) => handleChange('rol', text)} />
      </View>

      <TouchableOpacity style={styles.button} onPress={guardarCambios}>
        <Text style={styles.buttonText}>Guardar</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f2f2f2',
    flexGrow: 1,
  },
  fieldContainer: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    color: '#333',
    marginBottom: 5,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 12,
    backgroundColor: '#fff',
  },
  inputError: {
    borderColor: 'red',
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: 4,
  },
  button: {
    backgroundColor: '#0984e3',
    padding: 15,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f2f2f2',
  },
  loadingText: {
    fontSize: 16,
    color: '#555',
  },
});
