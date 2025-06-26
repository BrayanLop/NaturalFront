import { useRouter } from 'expo-router';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const personas = [
  { id: '1', nombre: 'Laura Gómez' },
  { id: '2', nombre: 'Carlos Pérez' },
  { id: '3', nombre: 'Ana Martínez' },
];

export default function SeleccionarPersona() {
  const router = useRouter();

  const seleccionar = (persona: { nombre: string }) => {
    router.push({
      pathname: '/(tabs)/registroServicio',
      params: { persona: persona.nombre },
    } as const);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Selecciona una persona</Text>
      <FlatList
        data={personas}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.item} onPress={() => seleccionar(item)}>
            <Text>{item.nombre}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 22, marginBottom: 10 },
  item: {
    padding: 15,
    borderBottomWidth: 1,
    borderColor: '#ccc',
  },
});