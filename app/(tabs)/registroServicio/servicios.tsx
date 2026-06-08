import BackButton from '@/components/BackButton';
import { useAuth } from '@/context/authContext';
import { logger } from '@/utils/logger';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { servicioService } from '../../api/services';

export default function RegistroServicio() {
  const { usuario } = useAuth();
  const [servicios, setServicios] = useState<any[]>([]);
  const [seleccionados, setSeleccionados] = useState<string[]>([]);
  const router = useRouter();
  const { persona } = useLocalSearchParams();

  useEffect(() => {
    servicioService.obtenerTodos()
      .then((res) => setServicios(res.data))
      .catch((err) => logger.error('Error al cargar servicios:', err));
  }, []);

  const toggleServicio = (id: string) => {
    setSeleccionados((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const continuar = () => {
    if (!persona || seleccionados.length === 0) {
      Alert.alert('Faltan datos', 'Debes seleccionar al menos un servicio');
      return;
    }

    router.push({
      pathname: '/(tabs)/registroServicio/formaPago',
      params: { 
        persona: persona as string,
        servicios: JSON.stringify(seleccionados),
      },
    });
  };

  const volverAPersonas = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <BackButton onPress={volverAPersonas} color="#2d3436" />
        <Text style={styles.title}>Seleccionar servicios</Text>
      </View>
      
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

      <TouchableOpacity style={styles.button} onPress={continuar}>
        <Text style={styles.buttonText}>Continuar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  title: { 
    fontSize: 20, 
    fontWeight: 'bold',
    flex: 1,
  },
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
