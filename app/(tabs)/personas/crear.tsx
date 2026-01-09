import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  KeyboardTypeOptions,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { api } from '../../api/api';

export default function CrearPersona() {
  const router = useRouter();

  const [persona, setPersona] = useState({
    nombre: '',
    apellido: '',
    cedula: '',
    residencia: '',
    email: '',
    edad: '',
    celular: '',
    fechaNacimiento: '',
  });

  const [errores, setErrores] = useState<Partial<Record<keyof typeof persona, string>>>({});
  const [showDatePicker, setShowDatePicker] = useState(false);

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
      await api.post('/Persona/Crear', {
        ...persona,
        edad: parseInt(persona.edad),
        rol: "02"
      });

      Alert.alert('Éxito', 'Persona creada correctamente');
      router.back();
    } catch (error) {
      console.error('Error al crear persona:', error);
      Alert.alert('Error', 'No se pudo crear la persona');
    }
  };

  const onChangeFecha = (_: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (selectedDate) {
      const iso = selectedDate.toISOString().split('T')[0];
      handleChange('fechaNacimiento', iso);
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
    { key: 'fechaNacimiento', label: 'Fecha de nacimiento', isDate: true },
  ];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {campos.map(({ key, label, keyboardType, isDate }) => (
        <View key={key} style={styles.fieldContainer}>
          <Text style={styles.label}>{label}</Text>

          {isDate ? (
            <>
              {Platform.OS === 'web' ? (
                <input
                  type="date"
                  value={persona.fechaNacimiento}
                  onChange={(e) => handleChange('fechaNacimiento', e.target.value)}
                  style={{
                    borderWidth: 1,
                    borderColor: errores[key] ? 'red' : '#ccc',
                    borderRadius: 6,
                    padding: 12,
                    backgroundColor: '#fff',
                    width: '100%',
                    fontSize: 16,
                  }}
                />
              ) : (
                <>
                  <TouchableOpacity
                    onPress={() => setShowDatePicker(true)}
                    style={[styles.input, errores[key] && styles.inputError]}>
                    <Text style={{ color: persona[key] ? '#000' : '#888' }}>
                      {persona[key] || 'Selecciona una fecha'}
                    </Text>
                  </TouchableOpacity>
                  {showDatePicker && (
                    <DateTimePicker
                      value={persona.fechaNacimiento ? new Date(persona.fechaNacimiento) : new Date()}
                      mode="date"
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      onChange={onChangeFecha}
                      maximumDate={new Date()}
                    />
                  )}
                </>
              )}
            </>
          ) : (
            <TextInput
              value={persona[key]}
              onChangeText={(text) => handleChange(key, text)}
              style={[styles.input, errores[key] && styles.inputError]}
              placeholder={label}
              keyboardType={keyboardType}
            />
          )}

          {errores[key] ? <Text style={styles.errorText}>{errores[key]}</Text> : null}
        </View>
      ))}

      <TouchableOpacity style={styles.button} onPress={guardar}>
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
});
