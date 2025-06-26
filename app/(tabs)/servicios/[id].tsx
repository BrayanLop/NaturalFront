import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, StyleSheet,
  Switch,
  Text, TextInput,
  TouchableOpacity, View
} from 'react-native';
import { api } from '../../api/api';

export default function ServicioDetalle() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [precio, setPrecio] = useState('');
  const [disponible, setDisponible] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      api.get(`/Servicio/Obtener/${id}`)
        .then(res => {
          const data = res.data;
          setNombre(data.nombre);
          setDescripcion(data.descripcion);
          setPrecio(data.precio.toString());
          setDisponible(data.disponible);
        })
        .catch(err => {
          console.error('Error al cargar servicio:', err);
          Alert.alert('Error', 'No se pudo cargar el servicio');
        })
        .finally(() => setLoading(false));
    }
  }, [id]);

  const actualizar = async () => {
    try {
      await api.put(`/Servicio/Actualizar/${id}`, {
        id: Number(id),
        nombre,
        descripcion,
        precio: parseFloat(precio),
        disponible,
        fechaCreacion: new Date().toISOString(), // puedes enviar la misma u omitirlo si el backend no lo requiere
      });

      Alert.alert('Éxito', 'Servicio actualizado');
      router.back();
    } catch (error) {
      console.error('Error al actualizar:', error);
      Alert.alert('Error', 'No se pudo actualizar el servicio');
    }
  };

  const eliminar = async () => {
    Alert.alert('Confirmar', '¿Eliminar este servicio?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/Servicio/Eliminar/${id}`);
            Alert.alert('Eliminado', 'Servicio eliminado');
            router.back();
          } catch (error) {
            console.error('Error al eliminar:', error);
            Alert.alert('Error', 'No se pudo eliminar');
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#00b894" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Editar Servicio</Text>

      <TextInput value={nombre} onChangeText={setNombre} placeholder="Nombre" style={styles.input} />
      <TextInput value={descripcion} onChangeText={setDescripcion} placeholder="Descripción" style={styles.input} />
      <TextInput value={precio} onChangeText={setPrecio} placeholder="Precio" keyboardType="decimal-pad" style={styles.input} />

      <View style={styles.switchRow}>
        <Text>Disponible</Text>
        <Switch value={disponible} onValueChange={setDisponible} />
      </View>

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
    backgroundColor: '#00b894', padding: 15, borderRadius: 6, alignItems: 'center', marginBottom: 10,
  },
  deleteButton: {
    backgroundColor: '#d63031', padding: 15, borderRadius: 6, alignItems: 'center',
  },
  buttonText: { color: 'white', fontWeight: 'bold' },
});
