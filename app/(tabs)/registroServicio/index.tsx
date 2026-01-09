import { useAuth } from '@/context/authContext';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
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
  const [personas, setPersonas] = useState<{ id: number; nombre: string; apellido?: string }[]>([]);
  const [personaFiltro, setPersonaFiltro] = useState<string>('');
  const [estadoFiltro, setEstadoFiltro] = useState<'todos' | 'liquidados' | 'confirmados'>('todos');

  const esRol01 = usuario?.rol === '01' || usuario?.rol === '1';

  useEffect(() => {
    if (!esRol01) return;
    api
      .get('/Persona/Obtener')
      .then((res) => setPersonas(res.data || []))
      .catch((err) => console.error('Error al cargar personas:', err));
  }, [esRol01]);

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

  const registrosFiltrados = registros.filter((item) => {
    if (esRol01 && personaFiltro) {
      if (String(item.personaId) !== personaFiltro) return false;
    }

    switch (estadoFiltro) {
      case 'liquidados':
        if (!item.liquidado) return false;
        break;
      case 'confirmados':
        if (!item.confirmado) return false;
        break;
      case 'todos':
      default:
        break;
    }

    return true;
  });

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.item}>
      <View style={styles.itemHeader}>
        <Text style={styles.itemTitle}>🧍 {item.nombrePersona ?? 'N/A'}</Text>
        <View style={styles.badges}>
          {item.confirmado && (
            <View style={[styles.badge, styles.badgeConfirmado]}>
              <Text style={styles.badgeText}>✓ Confirmado</Text>
            </View>
          )}
          {item.liquidado && (
            <View style={[styles.badge, styles.badgeLiquidado]}>
              <Text style={styles.badgeText}>💵 Liquidado</Text>
            </View>
          )}
        </View>
      </View>
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
          <View style={styles.filtros}>
            {esRol01 && (
              <View style={{ marginBottom: 10 }}>
                <Text style={styles.filtroLabel}>Persona</Text>
                <View style={styles.chipsRow}>
                  <TouchableOpacity
                    style={[styles.chip, !personaFiltro && styles.chipActive]}
                    onPress={() => setPersonaFiltro('')}
                  >
                    <Text style={[styles.chipText, !personaFiltro && styles.chipTextActive]}>Todas</Text>
                  </TouchableOpacity>
                  {personas.slice(0, 6).map((p) => (
                    <TouchableOpacity
                      key={p.id}
                      style={[styles.chip, personaFiltro === String(p.id) && styles.chipActive]}
                      onPress={() => setPersonaFiltro(String(p.id))}
                    >
                      <Text style={[styles.chipText, personaFiltro === String(p.id) && styles.chipTextActive]}>
                        {p.nombre}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            <Text style={styles.filtroLabel}>Estado</Text>
            <View style={styles.chipsRow}>
              {[
                { key: 'todos', label: 'Todos' },
                { key: 'liquidados', label: 'Liquidados' },
                { key: 'confirmados', label: 'Confirmados' },
              ].map((opt) => (
                <TouchableOpacity
                  key={opt.key}
                  style={[styles.chip, estadoFiltro === opt.key && styles.chipActive]}
                  onPress={() => setEstadoFiltro(opt.key as any)}
                >
                  <Text style={[styles.chipText, estadoFiltro === opt.key && styles.chipTextActive]}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

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
            data={registrosFiltrados}
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
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2d3436',
    flex: 1,
  },
  badges: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeConfirmado: {
    backgroundColor: '#00b894',
  },
  badgeLiquidado: {
    backgroundColor: '#0984e3',
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  filtros: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#dfe6e9',
  },
  filtroLabel: {
    fontWeight: '600',
    marginBottom: 6,
    color: '#2d3436',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#b2bec3',
    backgroundColor: '#fff',
  },
  chipActive: {
    backgroundColor: '#00b894',
    borderColor: '#00b894',
  },
  chipText: {
    color: '#2d3436',
    fontSize: 12,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#fff',
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
