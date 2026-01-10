import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { api } from '../../api/api';

export default function SeleccionarPersona() {
  const [personas, setPersonas] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    api.get('/Persona/Obtener')
      .then((res) => setPersonas(res.data))
      .catch((err) => console.error('Error al cargar personas:', err));
  }, []);

  const seleccionarPersona = (persona: any) => {
    router.push({
      pathname: '/(tabs)/registroServicio/servicios',
      params: { persona: persona.id.toString() },
    });
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={personas}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.item} onPress={() => seleccionarPersona(item)}>
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
    backgroundColor: '#dfe6e9',
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
  },
});
