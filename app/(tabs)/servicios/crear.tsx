import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert, StyleSheet,
  Switch,
  Text, TextInput, TouchableOpacity, View
} from 'react-native';
import { api } from '../../api/api';

export default function CrearServicio() {
  const router = useRouter();

  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [precio, setPrecio] = useState('');
  const [disponible, setDisponible] = useState(true);

  const guardar = async () => {
    if (!nombre || !precio) {
      Alert.alert('Campos obligatorios', 'Nombre y precio son requeridos');
      return;
    }

    try {
      await api.post('/Servicio/Crear', {
        nombre,
        descripcion,
        precio: parseFloat(precio),
        disponible,
        fechaCreacion: new Date().toISOString(),
      });

      Alert.alert('Éxito', 'Servicio creado correctamente');
      router.back();
    } catch (error) {
      console.error('Error al crear servicio:', error);
      Alert.alert('Error', 'No se pudo crear el servicio');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Nuevo Servicio</Text>

      <TextInput placeholder="Nombre" value={nombre} onChangeText={setNombre} style={styles.input} />
      <TextInput placeholder="Descripción" value={descripcion} onChangeText={setDescripcion} style={styles.input} />
      <TextInput placeholder="Precio" value={precio} onChangeText={setPrecio} style={styles.input} keyboardType="decimal-pad" />

      <View style={styles.switchRow}>
        <Text>Disponible</Text>
        <Switch value={disponible} onValueChange={setDisponible} />
      </View>

      <TouchableOpacity style={styles.button} onPress={guardar}>
        <Text style={styles.buttonText}>Guardar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 22, marginBottom: 15, fontWeight: 'bold' },
  input: {
    borderWidth: 1, borderColor: '#ccc', borderRadius: 6,
    padding: 10, marginBottom: 15,
  },
  switchRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15,
  },
  button: {
    backgroundColor: '#00b894', padding: 15, borderRadius: 6, alignItems: 'center',
  },
  buttonText: { color: 'white', fontWeight: 'bold' },
});
