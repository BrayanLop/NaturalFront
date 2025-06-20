import { useRouter } from 'expo-router';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const servicios = [
  { id: '1', nombre: 'Corte de cabello' },
  { id: '2', nombre: 'Manicure' },
];

export default function ListaServicios() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Servicios</Text>

      <FlatList
        data={servicios}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.item}
            onPress={() =>
              router.push({ pathname: '/(tabs)/servicios/[id]', params: { id: item.id } })
            }
          >
            <Text>{item.nombre}</Text>
          </TouchableOpacity>
        )}
      />

      <TouchableOpacity style={styles.addButton} onPress={() => router.push('/(tabs)/servicios/crear')}>
        <Text style={styles.addText}>+ Agregar Servicio</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, marginBottom: 20 },
  item: {
    padding: 15,
    borderBottomWidth: 1,
    borderColor: '#ccc',
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
