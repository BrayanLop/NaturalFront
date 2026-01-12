import SimpleDatePicker from '@/components/SimpleDatePicker';
import { COLORS, commonStyles } from '@/constants/theme';
import { useAuth } from '@/context/authContext';
import { formatDate, toDateInputValue } from '@/utils/formatters';
import { logger, showConfirm, showError, showSuccess } from '@/utils/logger';
import { isAdmin, puedeRegistrarServicios } from '@/utils/roles';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
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
  const [formaPagoFiltro, setFormaPagoFiltro] = useState<'todos' | 'T' | 'E'>('todos');
  const [confirmandoId, setConfirmandoId] = useState<number | null>(null);
  
  // Fechas por defecto: día actual
  const hoy = new Date();
  const fechaActual = toDateInputValue(hoy); // YYYY-MM-DD local
  const [fechaInicio, setFechaInicio] = useState<string>(fechaActual);
  const [fechaFin, setFechaFin] = useState<string>(fechaActual);
  const [showDatePickerInicio, setShowDatePickerInicio] = useState(false);
  const [showDatePickerFin, setShowDatePickerFin] = useState(false);
  const [pickerVisible, setPickerVisible] = useState<null | 'inicio' | 'fin'>(null);

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
      // Enviar fechas en hora local (inicio y fin del día)
      if (fechaInicio) {
        const inicioDate = new Date(fechaInicio + 'T00:00:00');
        params.fechaInicio = inicioDate.toISOString();
      }
      if (fechaFin) {
        const finDate = new Date(fechaFin + 'T23:59:59');
        params.fechaFin = finDate.toISOString();
      }
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
    const filtrados = registros.filter((item) => {
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

    // Filtro de forma de pago
    if (formaPagoFiltro !== 'todos') {
      if (item.formaPago !== formaPagoFiltro) return false;
    }

    return true;
    });
    
    // Ordenar del más reciente primero
    return filtrados.sort((a, b) => {
      const fechaA = new Date(a.fechaServicio).getTime();
      const fechaB = new Date(b.fechaServicio).getTime();
      return fechaB - fechaA; // Descendente (más reciente primero)
    });
  }, [registros, esRol01, personaFiltro, estadoFiltro, formaPagoFiltro]);

  // Calcular consolidado basado en registros filtrados
  const consolidado = useMemo(() => {
    const consolidadoMap = new Map<number, { 
      nombrePersona: string; 
      servicios: Map<string, { nombreServicio: string; cantidad: number }>
    }>();
    
    registrosFiltrados.forEach((registro: any) => {
      const personaId = registro.personaId;
      const nombrePersona = registro.nombrePersona || 'Sin nombre';
      const nombreServicio = registro.nombreServicio || 'Sin servicio';
      
      if (!consolidadoMap.has(personaId)) {
        consolidadoMap.set(personaId, { 
          nombrePersona, 
          servicios: new Map() 
        });
      }
      
      const persona = consolidadoMap.get(personaId)!;
      const servicioKey = nombreServicio;
      
      if (persona.servicios.has(servicioKey)) {
        persona.servicios.get(servicioKey)!.cantidad++;
      } else {
        persona.servicios.set(servicioKey, { nombreServicio, cantidad: 1 });
      }
    });
    
    return Array.from(consolidadoMap.values()).map(item => ({
      nombrePersona: item.nombrePersona,
      servicios: Array.from(item.servicios.values())
    }));
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
          <Text>🕒 Fecha: {item.fechaServicio ? formatDate(item.fechaServicio) : 'Sin fecha'}</Text>
          <Text>💳 Forma de pago: {item.formaPago === 'T' ? 'Transferencia' : item.formaPago === 'E' ? 'Efectivo' : 'No especificada'}</Text>
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

  // Handlers para DateTimePicker
  const onChangeFecha = (dateStr?: string) => {
    if (!dateStr || !pickerVisible) return;
    if (pickerVisible === 'inicio') setFechaInicio(dateStr);
    if (pickerVisible === 'fin') setFechaFin(dateStr);
    setPickerVisible(null);
  };

  return (
    <View style={styles.container}>
      <ScrollView>
        <View style={styles.filtros}>
          {/* Filtros de fecha con mejor diseño */}
          <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#2d3436', marginBottom: 10 }}>Filtrar por fechas</Text>
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
            <TouchableOpacity style={[styles.dateChip, { flex: 1 }]} onPress={() => setPickerVisible('inicio')}>
              <Text style={styles.chipLabel}>Desde</Text>
              <Text style={styles.chipValue}>{fechaInicio}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.dateChip, { flex: 1 }]} onPress={() => setPickerVisible('fin')}>
              <Text style={styles.chipLabel}>Hasta</Text>
              <Text style={styles.chipValue}>{fechaFin}</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.btnBuscar} onPress={cargarDatos} disabled={loading}>
            <Text style={styles.btnBuscarText}>{loading ? 'Buscando...' : 'Buscar'}</Text>
          </TouchableOpacity>
          <View style={{ height: 1, backgroundColor: '#e0e0e0', marginBottom: 18 }} />

          {/* Fila inferior: Filtros de chips en dos columnas */}
          <View style={styles.filtrosBottomRow}>
            {/* Columna izquierda */}
            <View style={styles.filtroColumn}>
              {esRol01 && (
                <View style={{ marginBottom: 12 }}>
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

              <View>
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
            </View>

            {/* Columna derecha */}
            <View style={styles.filtroColumn}>
              {/* Mover forma de pago abajo en una fila separada */}
              <View style={{ marginTop: 16 }}>
                <Text style={styles.filtroLabel}>Forma de pago</Text>
                <View style={[styles.chipsRow, { flexWrap: 'wrap', maxWidth: '100%' }]}>
                  {[
                    { key: 'todos', label: 'Todas' },
                    { key: 'E', label: 'Efectivo' },
                    { key: 'T', label: 'Transferencia' },
                  ].map((opt) => (
                    <TouchableOpacity
                      key={opt.key}
                      style={[styles.chip, formaPagoFiltro === opt.key && styles.chipActive]}
                      onPress={() => setFormaPagoFiltro(opt.key as any)}
                    >
                      <Text style={[styles.chipText, formaPagoFiltro === opt.key && styles.chipTextActive]}>{opt.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
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
                <View style={{ padding: 40, alignItems: 'center' }}>
                  <Text style={{ fontSize: 48, marginBottom: 16 }}>📋</Text>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: '#2d3436' }}>No hay registros disponibles</Text>
                </View>
              ) : (
                <View style={styles.consolidadoGrid}>
                  {consolidado.map((item, index) => {
                    const totalServicios = item.servicios.reduce((sum, s) => sum + s.cantidad, 0);
                    return (
                      <View key={index} style={styles.consolidadoPersona}>
                        <View style={styles.consolidadoHeader}>
                          <Text style={styles.consolidadoNombre}>🧑 {item.nombrePersona}</Text>
                          <Text style={styles.consolidadoTotalDebajo}>{totalServicios} servicio(s)</Text>
                        </View>
                        <View style={styles.consolidadoServicios}>
                          {item.servicios.map((servicio, sIndex) => (
                            <View key={sIndex} style={styles.consolidadoServicioItem}>
                              <Text style={styles.consolidadoServicioNombre}>• {servicio.nombreServicio}</Text>
                              <Text style={styles.consolidadoServicioCantidad}>{servicio.cantidad}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>

            {/* Lista de registros */}
            <FlatList
              data={registrosFiltrados}
              keyExtractor={keyExtractor}
              renderItem={renderItem}
              ListEmptyComponent={
                <View style={{ padding: 40, alignItems: 'center' }}>
                  <Text style={{ fontSize: 48, marginBottom: 16 }}>📋</Text>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: '#2d3436' }}>No hay registros disponibles</Text>
                </View>
              }
              scrollEnabled={false} // Usamos ScrollView padre
            />
          </>
        )}
      </ScrollView>

      <TouchableOpacity
        style={styles.button}
        onPress={() => {
          // Si el usuario puede registrar servicios (rol 02 o 03), vamos directo a seleccionar servicios
          const rol = usuario?.rol;
          const personaId = usuario?.id;
          if (puedeRegistrarServicios(rol)) {
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

      {/* SimpleDatePicker JS universal */}
      <SimpleDatePicker
        value={fechaInicio}
        onChange={onChangeFecha}
        visible={pickerVisible !== null}
        onClose={() => setPickerVisible(null)}
        title={pickerVisible === 'inicio' ? 'Selecciona la fecha de inicio' : 'Selecciona la fecha final'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
    dateChip: {
      flexDirection: 'column',
      alignItems: 'flex-start',
      backgroundColor: '#f1f2f6',
      borderRadius: 16,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderWidth: 1,
      borderColor: '#dfe6e9',
      marginRight: 4,
    },
    chipLabel: {
      fontSize: 12,
      color: '#636e72',
      marginBottom: 2,
      fontWeight: '600',
    },
    chipValue: {
      fontSize: 15,
      color: '#2d3436',
      fontWeight: 'bold',
    },
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
  consolidadoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: 0,
  },
  consolidadoPersona: {
    width: '50%',
    minWidth: 0,
    marginBottom: 8,
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  consolidadoHeader: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  consolidadoNombre: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2d3436',
  },
  consolidadoTotal: {
    fontSize: 12,
    fontWeight: '600',
    color: '#636e72',
  },
  consolidadoTotalDebajo: {
    fontSize: 12,
    fontWeight: '600',
    color: '#636e72',
    marginTop: 2,
  },
  consolidadoServicios: {
    paddingLeft: 12,
  },
  consolidadoServicioItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 3,
    paddingHorizontal: 6,
    backgroundColor: '#f8f9fa',
    borderRadius: 3,
    marginBottom: 3,
  },
  consolidadoServicioNombre: {
    fontSize: 12,
    color: '#636e72',
    flex: 1,
  },
  consolidadoServicioCantidad: {
    fontSize: 12,
    fontWeight: '600',
    color: '#00b894',
    minWidth: 25,
    textAlign: 'right',
  },

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
  filtrosTopRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
    alignItems: 'flex-end',
  },
  filtrosBottomRow: {
    flexDirection: 'row',
    gap: 12,
  },
  fechasContainer: {
    flex: 1,
  },
  filtroColumn: {
    flex: 1,
    minWidth: 200,
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
  btnBuscarCompact: {
    backgroundColor: '#00b894',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100,
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
