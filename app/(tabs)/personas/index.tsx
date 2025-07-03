import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { api } from '../../api/api'; // ✅ Asegúrate de que este path sea correcto

interface Persona {
  id: number;
  nombre: string;
  apellido: string;
  cedula: string;
  residencia: string;
  email: string;
  edad: number;
  celular?: string;
  fechaNacimiento: string;
}

export default function ListaPersonas() {
  const router = useRouter();
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('Persona/Obtener')
      .then((response) => {
        setPersonas(response.data);
      })
      .catch((error) => {
        console.error('Error al cargar personas:', error);
        Alert.alert('Error', 'No se pudieron cargar las personas');
      })
      .finally(() => setLoading(false));
  }, []);

  const renderItem = ({ item }: { item: Persona }) => (
    <TouchableOpacity
      style={styles.item}
      onPress={() => router.push({ pathname: '/personas/[id]', params: { id: item.id } })}
    >
      <Text style={styles.itemText}>
        👤 {item.nombre} {item.apellido}
      </Text>
      <Text style={styles.subText}>
        📱 {item.celular}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#00b894" />
      ) : (
        <FlatList
          data={personas}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          ListEmptyComponent={<Text>No hay personas registradas.</Text>}
        />
      )}

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => router.push('/personas/crear')}
      >
        <Text style={styles.addText}>+ Agregar persona</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  item: {
    padding: 15,
    borderBottomWidth: 1,
    borderColor: '#ccc',
  },
  itemText: {
    fontSize: 16,
    fontWeight: '500',
  },
  subText: {
    fontSize: 14,
    color: '#636e72',
  },
  addButton: {
    marginTop: 20,
    backgroundColor: '#00b894',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  addText: {
    color: 'white',
    fontWeight: 'bold',
  },
});
