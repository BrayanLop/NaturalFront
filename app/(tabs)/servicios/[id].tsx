import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function ServicioDetalle() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  // Simulando datos cargados
  const [nombre, setNombre] = useState('Nombre temporal');

  const actualizar = () => {
    console.log('Actualizando servicio:', id, nombre);
    router.back();
  };

  const eliminar = () => {
    console.log('Eliminando servicio:', id);
    router.back();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Editar Servicio</Text>
      <TextInput
        value={nombre}
        onChangeText={setNombre}
        style={styles.input}
      />
      <TouchableOpacity style={styles.button} onPress={actualizar}>
        <Text style={styles.buttonText}>Actualizar</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.deleteButton} onPress={eliminar}>
        <Text style={styles.buttonText}>Eliminar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 22, marginBottom: 10 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 10,
    marginBottom: 20,
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
