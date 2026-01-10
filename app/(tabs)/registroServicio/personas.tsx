import BackButton from '@/components/BackButton';
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

  const volverAtras = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <BackButton onPress={volverAtras} color="#2d3436" />
        <Text style={styles.title}>Seleccionar persona</Text>
      </View>
      
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
});
