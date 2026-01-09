import { COLORS, commonStyles } from '@/constants/theme';
import { useAuth } from '@/context/authContext';
import { formatDateTime } from '@/utils/formatters';
import { logger, showConfirm, showError, showSuccess } from '@/utils/logger';
import { isAdmin } from '@/utils/roles';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { api } from '../../api/api';
import { Persona } from '../../api/modelos/persona';
import { RegistroServicio } from '../../api/modelos/registroServicio';

export default function ListaRegistros() {
  const router = useRouter();
  const { usuario } = useAuth();
  const [registros, setRegistros] = useState<RegistroServicio[]>([]);
  const [loading, setLoading] = useState(false);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [personaFiltro, setPersonaFiltro] = useState<string>('');
  const [estadoFiltro, setEstadoFiltro] = useState<'todos' | 'liquidados' | 'confirmados' | 'noLiquidados' | 'noConfirmados'>('todos');
  const [confirmandoId, setConfirmandoId] = useState<number | null>(null);
  
  // Fechas por defecto: día actual
  const hoy = new Date();
  const fechaActual = hoy.toISOString().split('T')[0]; // YYYY-MM-DD
  const [fechaInicio, setFechaInicio] = useState<string>(fechaActual);
  const [fechaFin, setFechaFin] = useState<string>(fechaActual);

  const esRol01 = isAdmin(usuario?.rol);

  useEffect(() => {
    if (!esRol01) return;
    api
      .get('/Persona/Obtener')
      .then((res) => setPersonas(res.data || []))
      .catch((err) => logger.error('Error al cargar personas:', err));
  }, [esRol01]);

  const cargarDatos = useCallback(async () => {
    setLoading(true);
    try {
      const personaId = usuario?.id ?? null;
      const params: any = {};
      
      if (personaId) params.personaId = personaId;
      if (fechaInicio) params.fechaInicio = `${fechaInicio}T00:00:00`;
      if (fechaFin) params.fechaFin = `${fechaFin}T23:59:59`;
      
      const resRegistros = await api.get('/RegistroServicio/ObtenerRegistros', { params });

      if (Array.isArray(resRegistros.data)) {
        setRegistros(resRegistros.data);
      }
    } catch (error) {
      logger.error('Error al cargar datos:', error);
      showError('No se pudieron cargar los registros');
    } finally {
      setLoading(false);
    }
  }, [usuario, fechaInicio, fechaFin]);

  useFocusEffect(
    useCallback(() => {
      cargarDatos();
    }, [usuario])
  );

  const registrosFiltrados = useMemo(() => {
    return registros.filter((item) => {
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
      case 'noLiquidados':
        if (item.liquidado) return false;
        break;
      case 'noConfirmados':
        // No confirmados: ni confirmado ni liquidado (porque liquidado implica confirmado)
        if (item.confirmado || item.liquidado) return false;
        break;
      case 'todos':
      default:
        break;
    }

    return true;
    });
  }, [registros, esRol01, personaFiltro, estadoFiltro]);

  // Calcular consolidado basado en registros filtrados
  const consolidado = useMemo(() => {
    const consolidadoMap = new Map<number, { nombrePersona: string; cantidadServicios: number }>();
    
    registrosFiltrados.forEach((registro: any) => {
      const personaId = registro.personaId;
      const nombrePersona = registro.nombrePersona || 'Sin nombre';
      
      if (consolidadoMap.has(personaId)) {
        consolidadoMap.get(personaId)!.cantidadServicios++;
      } else {
        consolidadoMap.set(personaId, { nombrePersona, cantidadServicios: 1 });
      }
    });
    
    return Array.from(consolidadoMap.values());
  }, [registrosFiltrados]);

  const handleConfirmarRegistro = useCallback(async (registroServicioId: number) => {
    if (!esRol01) return;

    const confirmar = await showConfirm('¿Desea confirmar este registro?', 'Confirmar registro');
    if (!confirmar) return;

    setConfirmandoId(registroServicioId);
    try {
      await api.patch(
        `/RegistroServicio/ActualizarConfirmado/${registroServicioId}?confirmado=true`,
        {},
        { headers: { empresaId: '1' } }
      );

      showSuccess('Registro confirmado correctamente');
      cargarDatos();
    } catch (e: any) {
      logger.error('Error confirmando registro:', e);
      showError(e?.response?.data?.message || 'No se pudo confirmar el registro');
    } finally {
      setConfirmandoId(null);
    }
  }, [esRol01, cargarDatos]);

  const renderItem = useCallback(({ item }: { item: any }) => (
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
      
      <View style={styles.itemContent}>
        <View style={{ flex: 1 }}>
          <Text>🧾 Servicio: {item.nombreServicio ?? 'N/A'}</Text>
          <Text>🕒 Fecha: {item.fechaServicio ? formatDateTime(item.fechaServicio) : 'Sin fecha'}</Text>
        </View>
        
        {esRol01 && !item.confirmado && !item.liquidado && (
          <View style={styles.confirmContainer}>
            <TouchableOpacity
              style={[styles.confirmButton, confirmandoId === item.id && styles.confirmButtonLoading]}
              onPress={() => handleConfirmarRegistro(item.id)}
              disabled={confirmandoId === item.id}
            >
              <Text style={styles.confirmButtonText}>
                {confirmandoId === item.id ? '...' : 'Confirmar'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  ), [esRol01, confirmandoId, handleConfirmarRegistro]);

  const keyExtractor = useCallback((item: any) => item.id.toString(), []);

  return (
    <View style={styles.container}>
      <ScrollView>
        <View style={styles.filtros}>
          {/* Filtros de fecha */}
          <View style={{ marginBottom: 10 }}>
            <Text style={styles.filtroLabel}>Rango de fechas</Text>
            <View style={styles.fechasRow}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={styles.fechaLabel}>Desde</Text>
                {Platform.OS === 'web' ? (
                  <input
                    type="date"
                    value={fechaInicio}
                    onChange={(e: any) => setFechaInicio(e.target.value)}
                    style={{
                      borderWidth: 1,
                      borderColor: '#b2bec3',
                      borderRadius: 6,
                      padding: 8,
                      backgroundColor: '#fff',
                      fontSize: 14,
                      width: '100%',
                    }}
                  />
                ) : (
                  <TextInput
                    style={styles.inputFecha}
                    value={fechaInicio}
                    onChangeText={setFechaInicio}
                    placeholder="YYYY-MM-DD"
                  />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.fechaLabel}>Hasta</Text>
                {Platform.OS === 'web' ? (
                  <input
                    type="date"
                    value={fechaFin}
                    onChange={(e: any) => setFechaFin(e.target.value)}
                    style={{
                      borderWidth: 1,
                      borderColor: '#b2bec3',
                      borderRadius: 6,
                      padding: 8,
                      backgroundColor: '#fff',
                      fontSize: 14,
                      width: '100%',
                    }}
                  />
                ) : (
                  <TextInput
                    style={styles.inputFecha}
                    value={fechaFin}
                    onChangeText={setFechaFin}
                    placeholder="YYYY-MM-DD"
                  />
                )}
              </View>
            </View>
            <TouchableOpacity
              style={styles.btnBuscar}
              onPress={cargarDatos}
              disabled={loading}
            >
              <Text style={styles.btnBuscarText}>
                {loading ? 'Buscando...' : '🔍 Buscar'}
              </Text>
            </TouchableOpacity>
          </View>
          
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
              { key: 'noLiquidados', label: 'No liquidados' },
              { key: 'noConfirmados', label: 'No confirmados' },
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

        {loading ? (
          <View style={{ padding: 20, alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#00b894" />
          </View>
        ) : (
          <>
            {/* Consolidado */}
            <View style={styles.tableContainer}>
              <Text style={styles.tableTitle}>📊 Consolidado</Text>
              {consolidado.length === 0 ? (
                <Text style={styles.emptyText}>No hay datos</Text>
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
              keyExtractor={keyExtractor}
              renderItem={renderItem}
              ListEmptyComponent={<Text style={styles.emptyText}>No hay registros disponibles.</Text>}
              scrollEnabled={false} // Usamos ScrollView padre
            />
          </>
        )}
      </ScrollView>

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
  container: { 
    ...commonStyles.container,
  },

  tableContainer: {
    marginBottom: 20,
    backgroundColor: COLORS.cardBackground,
    borderRadius: 8,
    padding: 12,
  },
  tableTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: COLORS.text,
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
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
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
  confirmContainer: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    marginLeft: 8,
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
  fechasRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  fechaLabel: {
    fontSize: 12,
    color: '#636e72',
    marginBottom: 4,
  },
  inputFecha: {
    borderWidth: 1,
    borderColor: '#b2bec3',
    borderRadius: 6,
    padding: 8,
    backgroundColor: '#fff',
    fontSize: 14,
  },
  btnBuscar: {
    backgroundColor: '#00b894',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 10,
  },
  btnBuscarText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
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
  confirmButton: {
    backgroundColor: '#fff',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 2,
    borderColor: '#0d6efd',
  },
  confirmButtonLoading: {
    opacity: 0.6,
  },
  confirmButtonText: {
    color: '#0d6efd',
    fontWeight: 'bold',
    fontSize: 12,
  },
});
