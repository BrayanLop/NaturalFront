import DateTimePicker from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { api } from '../../api/api';

export default function PersonaDetalle() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [persona, setPersona] = useState({
    id: 0,
    nombre: '',
    apellido: '',
    cedula: '',
    residencia: '',
    email: '',
    edad: 0,
    celular: '',
    fechaNacimiento: '',
  });

  const [errores, setErrores] = useState<{ [campo: string]: string }>({});
  const [loading, setLoading] = useState(true);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const validaciones: Record<string, { regex: RegExp; mensaje: string }> = {
    nombre: { regex: /^[A-Za-zÁÉÍÓÚáéíóúñÑ\s]+$/, mensaje: 'Nombre inválido' },
    apellido: { regex: /^[A-Za-zÁÉÍÓÚáéíóúñÑ\s]+$/, mensaje: 'Apellido inválido' },
    cedula: { regex: /^\d{6,10}$/, mensaje: 'Cédula inválida (6 a 10 dígitos)' },
    email: { regex: /^[\w.-]+@[\w.-]+\.\w+$/, mensaje: 'Correo inválido' },
    celular: { regex: /^\d{10}$/, mensaje: 'Celular inválido (10 dígitos)' },
    fechaNacimiento: { regex: /^\d{4}-\d{2}-\d{2}$/, mensaje: 'Formato: YYYY-MM-DD' },
  };

  useEffect(() => {
    if (id) {
      api.get(`/Persona/Obtener/${id}`)
        .then(response => {
          const data = response.data;
          setPersona({
            id: data.id,
            nombre: data.nombre,
            apellido: data.apellido,
            cedula: data.cedula,
            residencia: data.residencia,
            email: data.email,
            edad: data.edad,
            celular: data.celular ?? '',
            fechaNacimiento: data.fechaNacimiento?.split('T')[0],
          });
        })
        .catch(error => {
          console.error('Error al obtener persona:', error);
          Alert.alert('Error', 'No se pudo cargar la persona');
        })
        .finally(() => setLoading(false));
    }
  }, [id]);

  const handleInputChange = (campo: string, valor: string) => {
    setPersona((prev) => ({ ...prev, [campo]: valor }));

    if (validaciones[campo]) {
      const { regex, mensaje } = validaciones[campo];
      setErrores((prev) => ({
        ...prev,
        [campo]: regex.test(valor) ? '' : mensaje,
      }));
    }
  };

  const handleEdadChange = (text: string) => {
    const num = parseInt(text);
    setPersona((prev) => ({ ...prev, edad: isNaN(num) ? 0 : num }));
    setErrores((prev) => ({
      ...prev,
      edad: isNaN(num) || num <= 0 ? 'Edad inválida' : '',
    }));
  };

  const actualizar = async () => {
    for (const key in validaciones) {
      const valor = persona[key as keyof typeof persona]?.toString() || '';
      const { regex, mensaje } = validaciones[key];
      if (!regex.test(valor)) {
        Alert.alert('Error', mensaje);
        return;
      }
    }

    if (persona.edad <= 0 || isNaN(persona.edad)) {
      Alert.alert('Error', 'Edad inválida');
      return;
    }

    try {
      await api.put(`/Persona/Actualizar/${id}`, {
        ...persona,
        edad: Number(persona.edad),
      });
      Alert.alert('Éxito', 'Persona actualizada correctamente');
      router.back();
    } catch (error) {
      console.error('Error al actualizar:', error);
      Alert.alert('Error', 'No se pudo actualizar');
    }
  };

  const eliminar = async () => {
    Alert.alert(
      'Confirmar',
      '¿Estás seguro de eliminar esta persona?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/Persona/Eliminar/${id}`);
              Alert.alert('Eliminado', 'Persona eliminada correctamente');
              router.back();
            } catch (error) {
              console.error('Error al eliminar:', error);
              Alert.alert('Error', 'No se pudo eliminar');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#00b894" />
      </View>
    );
  }

  const campos = [
    { key: 'nombre', label: 'Nombre' },
    { key: 'apellido', label: 'Apellido' },
    { key: 'cedula', label: 'Cédula' },
    { key: 'residencia', label: 'Residencia' },
    { key: 'email', label: 'Correo electrónico' },
    { key: 'celular', label: 'Celular' },
    { key: 'fechaNacimiento', label: 'Fecha de nacimiento' },
  ];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {campos.map(({ key, label }) =>
        key === 'fechaNacimiento' ? (
          <View key={key} style={styles.fieldContainer}>
            <Text style={styles.label}>{label}</Text>

            <TouchableOpacity
              onPress={() => setShowDatePicker(true)}
              style={[
                styles.input,
                { justifyContent: 'center' },
                errores.fechaNacimiento && styles.inputError,
              ]}
            >
              <Text style={{ color: persona.fechaNacimiento ? '#000' : '#999' }}>
                {persona.fechaNacimiento || 'Selecciona una fecha'}
              </Text>
            </TouchableOpacity>

            {errores.fechaNacimiento ? (
              <Text style={styles.errorText}>{errores.fechaNacimiento}</Text>
            ) : null}

            {showDatePicker && (
              <DateTimePicker
                value={
                  persona.fechaNacimiento
                    ? new Date(persona.fechaNacimiento)
                    : new Date('2000-01-01')
                }
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowDatePicker(false);
                  if (selectedDate) {
                    const fecha = selectedDate.toISOString().split('T')[0];
                    setPersona((prev) => ({ ...prev, fechaNacimiento: fecha }));

                    const { regex, mensaje } = validaciones.fechaNacimiento;
                    setErrores((prev) => ({
                      ...prev,
                      fechaNacimiento: regex.test(fecha) ? '' : mensaje,
                    }));
                  }
                }}
              />
            )}
          </View>
        ) : (
          <View key={key} style={styles.fieldContainer}>
            <Text style={styles.label}>{label}</Text>
            <TextInput
              value={persona[key as keyof typeof persona]?.toString() || ''}
              onChangeText={(text) => handleInputChange(key, text)}
              style={[
                styles.input,
                errores[key] && styles.inputError,
              ]}
            />
            {errores[key] ? <Text style={styles.errorText}>{errores[key]}</Text> : null}
          </View>
        )
      )}

      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Edad</Text>
        <TextInput
          value={persona.edad.toString()}
          keyboardType="numeric"
          onChangeText={handleEdadChange}
          style={[
            styles.input,
            errores.edad && styles.inputError,
          ]}
        />
        {errores.edad ? <Text style={styles.errorText}>{errores.edad}</Text> : null}
      </View>

      <TouchableOpacity style={styles.button} onPress={actualizar}>
        <Text style={styles.buttonText}>Actualizar</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.deleteButton} onPress={eliminar}>
        <Text style={styles.buttonText}>Eliminar</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20, backgroundColor: '#f2f2f2' },
  fieldContainer: { marginBottom: 15 },
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
    padding: 10,
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
    backgroundColor: '#00b894',
    padding: 15,
    borderRadius: 6,
    alignItems: 'center',
    marginBottom: 10,
  },
  deleteButton: {
    backgroundColor: '#d63031',
    padding: 15,
    borderRadius: 6,
    alignItems: 'center',
  },
  buttonText: { color: 'white', fontWeight: 'bold' },
});
