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
import { api } from '../../api/api'; // Asegúrate que la ruta sea correcta

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
  const [loading, setLoading] = useState(true);

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
            fechaNacimiento: data.fechaNacimiento?.split('T')[0], // formato YYYY-MM-DD
          });
        })
        .catch(error => {
          console.error('Error al obtener persona:', error);
          Alert.alert('Error', 'No se pudo cargar la persona');
        })
        .finally(() => setLoading(false));
    }
  }, [id]);

  const actualizar = async () => {
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

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Editar Persona</Text>

      {['nombre', 'apellido', 'cedula', 'residencia', 'email', 'celular', 'fechaNacimiento'].map((campo) => (
        <TextInput
          key={campo}
          placeholder={campo.charAt(0).toUpperCase() + campo.slice(1)}
          value={persona[campo as keyof typeof persona]?.toString() || ''}
          onChangeText={(text) => setPersona({ ...persona, [campo]: text })}
          style={styles.input}
        />
      ))}

      <TextInput
        placeholder="Edad"
        value={persona.edad.toString()}
        keyboardType="numeric"
        onChangeText={(text) => setPersona({ ...persona, edad: parseInt(text) || 0 })}
        style={styles.input}
      />

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
  container: { flexGrow: 1, padding: 20 },
  title: { fontSize: 22, marginBottom: 10 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 10,
    marginBottom: 15,
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
