import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ListaRegistros() {
  const router = useRouter();
  const [registros, setRegistros] = useState<any[]>([]);
  const { persona, servicios } = useLocalSearchParams();

  useFocusEffect(
    useCallback(() => {
      if (persona && servicios) {
        setRegistros((prev) => [
          ...prev,
          {
            persona,
            servicios: (servicios as string).split(','),
            fecha: new Date().toLocaleString(),
          },
        ]);
      }
    }, [persona, servicios])
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Registros de Servicios</Text>

      <FlatList
        data={registros}
        keyExtractor={(_, i) => i.toString()}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text>🧍 Persona: {item.persona}</Text>
            <Text>🧾 Servicios: {item.servicios.join(', ')}</Text>
            <Text>🕒 Fecha: {item.fecha}</Text>
          </View>
        )}
      />

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.navigate('/(tabs)/registroServicio/personas')}
      >
        <Text style={styles.buttonText}>Registrar nuevo</Text>
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
  button: {
    backgroundColor: '#00b894',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: { color: 'white', fontWeight: 'bold' },
});