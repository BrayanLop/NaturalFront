import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function CrearServicio() {
  const [nombre, setNombre] = useState('');
  const router = useRouter();

  const guardar = () => {
    console.log('Guardando servicio:', nombre);
    router.back();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Nuevo Servicio</Text>
      <TextInput
        placeholder="Nombre del servicio"
        value={nombre}
        onChangeText={setNombre}
        style={styles.input}
      />
      <TouchableOpacity style={styles.button} onPress={guardar}>
        <Text style={styles.buttonText}>Guardar</Text>
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
  },
  buttonText: { color: 'white', fontWeight: 'bold' },
});
