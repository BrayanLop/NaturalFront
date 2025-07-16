import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { api } from '../../api/api';

export default function RegistroServicio() {
  const [servicios, setServicios] = useState<any[]>([]);
  const [seleccionados, setSeleccionados] = useState<string[]>([]);
  const router = useRouter();
  const { persona } = useLocalSearchParams();

  useEffect(() => {
    api.get('/Servicio/Obtener')
      .then((res) => setServicios(res.data))
      .catch((err) => console.error('Error al cargar servicios:', err));
  }, []);

  const toggleServicio = (id: string) => {
    setSeleccionados((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const confirmar = async () => {
    if (!persona || seleccionados.length === 0) {
      Alert.alert('Faltan datos', 'Debes seleccionar al menos un servicio');
      return;
    }

    const registros = seleccionados.map((servicioId) => ({
      personaId: parseInt(persona as string),
      servicioId: parseInt(servicioId),
    }));

    try {
      await api.post('/RegistroServicio/Guardar', registros);
      Alert.alert('Éxito', 'Servicios registrados correctamente');
      router.replace('/(tabs)/registroServicio'); // ✅ Regresa al listado
    } catch (error) {
      console.error('Error al guardar registros:', error);
      Alert.alert('Error', 'No se pudieron guardar los servicios');
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={servicios}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.item,
              seleccionados.includes(item.id.toString()) && styles.itemSeleccionado,
            ]}
            onPress={() => toggleServicio(item.id.toString())}
          >
            <Text>{item.nombre}</Text>
          </TouchableOpacity>
        )}
      />

      <TouchableOpacity style={styles.button} onPress={confirmar}>
        <Text style={styles.buttonText}>Confirmar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 22, marginBottom: 10 },
  item: {
    backgroundColor: '#dfe6e9',
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
  },
  itemSeleccionado: {
    backgroundColor: '#81ecec',
  },
  button: {
    backgroundColor: '#0984e3',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: { color: 'white', fontWeight: 'bold' },
});
