import { useAuth } from '@/context/authContext';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { api } from '../../api/api';

export default function ListaRegistros() {
  const router = useRouter();
  const { usuario } = useAuth();
  const [registros, setRegistros] = useState<any[]>([]);
  const [consolidado, setConsolidado] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const cargarDatos = useCallback(async () => {
    setLoading(true);
    try {
      const personaId = usuario?.id ?? null;
      const [resRegistros, resConsolidado] = await Promise.all([
        api.get('/RegistroServicio/ObtenerRegistros', {
          params: personaId ? { personaId } : {},
        }),
        api.get('/RegistroServicio/ObtenerConsolidadoDia', {
          params: personaId ? { personaId } : {},
        }),
      ]);

      if (Array.isArray(resRegistros.data)) setRegistros(resRegistros.data);
      if (Array.isArray(resConsolidado.data)) setConsolidado(resConsolidado.data);
    } catch (error) {
      console.error('❌ Error al cargar datos:', error);
      Alert.alert('Error', 'No se pudieron cargar los registros');
    } finally {
      setLoading(false);
    }
  }, [usuario]);

  useFocusEffect(
    useCallback(() => {
      cargarDatos();
    }, [cargarDatos])
  );

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.item}>
      <Text>🧍 Persona: {item.nombrePersona ?? 'N/A'}</Text>
      <Text>🧾 Servicio: {item.nombreServicio ?? 'N/A'}</Text>
      <Text>🕒 Fecha: {item.fechaServicio ? new Date(item.fechaServicio).toLocaleString() : 'Sin fecha'}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#00b894" />
      ) : (
        <ScrollView>
          {/* Consolidado */}
          <View style={styles.tableContainer}>
            <Text style={styles.tableTitle}>📊 Consolidado del día</Text>
            {consolidado.length === 0 ? (
              <Text style={styles.emptyText}>No hay datos del día actual.</Text>
            ) : (
              consolidado.map((item, index) => (
                <View key={index} style={styles.row}>
                  <Text style={styles.cellNombre}>{item.nombrePersona}</Text>
                  <Text style={styles.cellCantidad}>{item.cantidadServicios} servicio(s)</Text>
                </View>
              ))
            )}
          </View>

          {/* Lista de registros */}
          <FlatList
            data={registros}
            keyExtractor={(_, i) => i.toString()}
            renderItem={renderItem}
            ListEmptyComponent={<Text style={styles.emptyText}>No hay registros disponibles.</Text>}
            scrollEnabled={false} // Usamos ScrollView padre
          />
        </ScrollView>
      )}

      <TouchableOpacity
        style={styles.button}
        onPress={() => {
          // Si el usuario tiene rol 02 (barbero), vamos directo a seleccionar servicios
          const rol = usuario?.rol;
          const personaId = usuario?.id;
          if (rol === '02' || rol === '2') {
            router.push({
              pathname: '/(tabs)/registroServicio/servicios',
              params: { persona: personaId?.toString() ?? '' },
            });
            return;
          }

          router.navigate('/(tabs)/registroServicio/personas');
        }}
      >
        <Text style={styles.buttonText}>Registrar nuevo</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f2f2f2' },

  tableContainer: {
    marginBottom: 20,
    backgroundColor: '#dfe6e9',
    borderRadius: 8,
    padding: 12,
  },
  tableTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#2d3436',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 0.5,
    borderColor: '#b2bec3',
  },
  cellNombre: { fontSize: 14, color: '#2d3436' },
  cellCantidad: { fontSize: 14, fontWeight: '600', color: '#0984e3' },

  item: {
    backgroundColor: '#dfe6e9',
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
  },
  emptyText: {
    textAlign: 'center',
    color: '#636e72',
    paddingVertical: 10,
  },
  button: {
    backgroundColor: '#00b894',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: { color: 'white', fontWeight: 'bold' },
});
