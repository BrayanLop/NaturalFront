import { useRouter } from 'expo-router';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const personas = [
  { id: '1', nombre: 'Juan' },
  { id: '2', nombre: 'María' },
];

export default function ListaPersonas() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Personas</Text>

      <FlatList
        data={personas}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.item}
            onPress={() => router.push({ pathname: '/personas/[id]', params: { id: item.id } })}
          >
            <Text>{item.nombre}</Text>
          </TouchableOpacity>
        )}
      />

      <TouchableOpacity style={styles.addButton} onPress={() => router.push('/personas/crear')}>
        <Text style={styles.addText}>+ Agregar Persona</Text>
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
