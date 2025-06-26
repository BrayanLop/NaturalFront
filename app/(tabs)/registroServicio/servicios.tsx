import { Href, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const servicios = [
  { id: 'a', nombre: 'Corte de cabello' },
  { id: 'b', nombre: 'Manicure' },
  { id: 'c', nombre: 'Depilación' },
];

export default function SeleccionarServicios() {
  const { persona } = useLocalSearchParams();
  const router = useRouter();
  const [seleccionados, setSeleccionados] = useState<string[]>([]);

  const toggle = (id: string) => {
    setSeleccionados((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

const aceptar = () => {
  const ruta: Href = {
    pathname: '/(tabs)/registroServicio',
    params: {
      persona: persona as string,
      servicios: seleccionados.join(','),
    },
  };

  router.push(ruta);
};

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Servicios para {persona}</Text>
      <FlatList
        data={servicios}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.item,
              seleccionados.includes(item.id) && styles.itemSelected,
            ]}
            onPress={() => toggle(item.id)}
          >
            <Text style={{ color: seleccionados.includes(item.id) ? 'white' : 'black' }}>
              {item.nombre}
            </Text>
          </TouchableOpacity>
        )}
      />
      <TouchableOpacity style={styles.continue} onPress={aceptar}>
        <Text style={styles.continueText}>Aceptar</Text>
      </TouchableOpacity>
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
    marginBottom: 5,
  },
  itemSelected: {
    backgroundColor: '#00b894',
  },
  continue: {
    marginTop: 20,
    backgroundColor: '#00b894',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  continueText: { color: 'white', fontWeight: 'bold' },
});