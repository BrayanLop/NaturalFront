import SimpleDatePicker from '@/components/SimpleDatePicker';
import { COLORS, FONT_SIZE, FONT_WEIGHT, RADIUS, SHADOWS, SPACING, commonStyles } from '@/constants/theme';
import { useAuth } from '@/context/authContext';
import { formatDate, toDateInputValue } from '@/utils/formatters';
import { logger, showConfirm, showError, showSuccess } from '@/utils/logger';
import { isAdmin, puedeRegistrarServicios } from '@/utils/roles';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    Linking,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { api } from '../../api/api';
import { Persona } from '../../api/modelos/persona';
import { Evidencia, RegistroServicio } from '../../api/modelos/registroServicio';

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
  const [editandoFormaPagoId, setEditandoFormaPagoId] = useState<number | null>(null);
  const [actualizandoFormaPago, setActualizandoFormaPago] = useState(false);
  
  // Estado para evidencias
  const [evidenciasModalVisible, setEvidenciasModalVisible] = useState(false);
  const [evidenciasActuales, setEvidenciasActuales] = useState<Evidencia[]>([]);
  const [cargandoEvidencias, setCargandoEvidencias] = useState(false);
  const [imagenSeleccionada, setImagenSeleccionada] = useState<number>(0);
  
  // Fechas por defecto: día actual
  const hoy = new Date();
  const fechaActual = toDateInputValue(hoy); // YYYY-MM-DD local
  const [fechaInicio, setFechaInicio] = useState<string>(fechaActual);
  const [fechaFin, setFechaFin] = useState<string>(fechaActual);
  const [showDatePickerInicio, setShowDatePickerInicio] = useState(false);
  const [showDatePickerFin, setShowDatePickerFin] = useState(false);
  const [pickerVisible, setPickerVisible] = useState<null | 'inicio' | 'fin'>(null);

  // Roles 01 (Admin) y 03 (Super Empleado) pueden editar
  const puedeEditar = isAdmin(usuario?.rol);

  useEffect(() => {
    if (!puedeEditar) return;
    api
      .get('/Persona/Obtener')
      .then((res) => setPersonas(res.data || []))
      .catch((err) => logger.error('Error al cargar personas:', err));
  }, [puedeEditar]);

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
    if (puedeEditar && personaFiltro) {
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
  }, [registros, puedeEditar, personaFiltro, estadoFiltro, formaPagoFiltro]);

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
    if (!puedeEditar) return;

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
  }, [puedeEditar, cargarDatos]);

  const handleActualizarFormaPago = useCallback(async (registroServicioId: number, formaPago: 'T' | 'E') => {
    if (!puedeEditar) return;

    setActualizandoFormaPago(true);
    try {
      await api.patch(
        `/RegistroServicio/ActualizarFormaPago/${registroServicioId}?formaPago=${formaPago}`,
        {},
        { headers: { empresaId: '1' } }
      );

      showSuccess('Forma de pago actualizada correctamente');
      setEditandoFormaPagoId(null);
      cargarDatos();
    } catch (e: any) {
      logger.error('Error actualizando forma de pago:', e);
      showError(e?.response?.data?.message || 'No se pudo actualizar la forma de pago');
    } finally {
      setActualizandoFormaPago(false);
    }
  }, [puedeEditar, cargarDatos]);

  const verEvidencias = useCallback(async (registro: any) => {
    setCargandoEvidencias(true);
    setEvidenciasModalVisible(true);
    setImagenSeleccionada(0);
    
    // Si las evidencias ya vienen del backend, usarlas directamente
    if (registro.evidencias && Array.isArray(registro.evidencias)) {
      setEvidenciasActuales(registro.evidencias);
      setCargandoEvidencias(false);
      return;
    }
    
    // Fallback: cargar evidencias si no vienen del backend
    try {
      const response = await api.get(`/Evidencia/ObtenerEvidencias/${registro.id}`);
      setEvidenciasActuales(response.data || []);
    } catch (error) {
      logger.error('Error al cargar evidencias:', error);
      showError('No se pudieron cargar las evidencias');
      setEvidenciasActuales([]);
    } finally {
      setCargandoEvidencias(false);
    }
  }, []);

  const renderItem = useCallback(({ item }: { item: any }) => (
    <View style={styles.item}>
      <View style={styles.itemHeader}>
        <Text style={styles.itemTitle}>{item.nombrePersona ?? 'N/A'}</Text>
        <View style={styles.badges}>
          {item.confirmado && (
            <View style={[styles.badge, styles.badgeConfirmado]}>
              <Text style={styles.badgeText}>Confirmado</Text>
            </View>
          )}
          {item.liquidado && (
            <View style={[styles.badge, styles.badgeLiquidado]}>
              <Text style={styles.badgeText}>Liquidado</Text>
            </View>
          )}
        </View>
      </View>
      
      <View style={styles.itemContent}>
        <View style={styles.itemDetails}>
          <View style={styles.itemDetailRow}>
            <FontAwesome5 name="cut" size={12} color={COLORS.textSecondary} />
            <Text style={styles.itemDetailText}>Servicio: {item.nombreServicio ?? 'N/A'}</Text>
          </View>
          <View style={styles.itemDetailRow}>
            <FontAwesome5 name="calendar" size={12} color={COLORS.textSecondary} />
            <Text style={styles.itemDetailText}>{item.fechaServicio ? formatDate(item.fechaServicio) : 'Sin fecha'}</Text>
          </View>
          
          {/* Forma de pago con opción de editar */}
          {puedeEditar && !item.liquidado && editandoFormaPagoId === item.id ? (
            <View style={styles.formaPagoEditRow}>
              <Text style={styles.formaPagoLabel}>Forma de pago:</Text>
              <TouchableOpacity
                style={[styles.formaPagoOption, item.formaPago === 'E' && styles.formaPagoOptionActive]}
                onPress={() => handleActualizarFormaPago(item.id, 'E')}
                disabled={actualizandoFormaPago}
              >
                <Text style={[styles.formaPagoOptionText, item.formaPago === 'E' && styles.formaPagoOptionTextActive]}>Efectivo</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.formaPagoOption, item.formaPago === 'T' && styles.formaPagoOptionActive]}
                onPress={() => handleActualizarFormaPago(item.id, 'T')}
                disabled={actualizandoFormaPago}
              >
                <Text style={[styles.formaPagoOptionText, item.formaPago === 'T' && styles.formaPagoOptionTextActive]}>Transferencia</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setEditandoFormaPagoId(null)} style={styles.formaPagoCancelButton}>
                <Text style={styles.formaPagoCancelText}>✕</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.itemDetailRow}
              onPress={() => puedeEditar && !item.liquidado ? setEditandoFormaPagoId(item.id) : null}
              disabled={item.liquidado || !puedeEditar}
            >
              <FontAwesome5 name="credit-card" size={12} color={COLORS.textSecondary} />
              <Text style={styles.itemDetailText}>
                {item.formaPago === 'T' ? 'Transferencia' : item.formaPago === 'E' ? 'Efectivo' : 'No especificada'}
                {puedeEditar && !item.liquidado && <Text style={styles.editIcon}> ✎</Text>}
              </Text>
            </TouchableOpacity>
          )}
        </View>
        
        {/* Botón para ver evidencias - solo si tiene evidencias */}
        {item.evidencias && item.evidencias.length > 0 && (
          <TouchableOpacity
            style={styles.evidenciasButton}
            onPress={() => verEvidencias(item)}
          >
            <FontAwesome5 name="image" size={14} color={COLORS.primary} />
            <Text style={styles.evidenciasButtonText}>Ver evidencias ({item.evidencias.length})</Text>
          </TouchableOpacity>
        )}
        
        {puedeEditar && !item.confirmado && !item.liquidado && (
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
  ), [puedeEditar, confirmandoId, handleConfirmarRegistro, editandoFormaPagoId, actualizandoFormaPago, handleActualizarFormaPago, verEvidencias]);

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
      {/* Header profesional */}
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Registro de Servicios</Text>
          <Text style={styles.headerSubtitle}>
            {registrosFiltrados.length} registro{registrosFiltrados.length !== 1 ? 's' : ''}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.headerAddButton}
          onPress={() => {
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
          <FontAwesome5 name="plus" size={16} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.filtros}>
          {/* Filtros de fecha con mejor diseño */}
          <Text style={styles.filtrosTitle}>Filtrar por fechas</Text>
          <View style={styles.dateRow}>
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
          <View style={styles.divider} />

          {/* Fila inferior: Filtros de chips en dos columnas */}
          <View style={styles.filtrosBottomRow}>
            {/* Columna izquierda */}
            <View style={styles.filtroColumn}>
              {puedeEditar && (
                <View style={styles.filtroSection}>
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
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Cargando registros...</Text>
          </View>
        ) : (
          <>
            {/* Consolidado */}
            <View style={styles.tableContainer}>
              <Text style={styles.tableTitle}>📊 Consolidado</Text>
              {consolidado.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <View style={styles.emptyIconContainer}>
                    <FontAwesome5 name="clipboard-list" size={48} color={COLORS.primary} />
                  </View>
                  <Text style={styles.emptyTitle}>No hay registros disponibles</Text>
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
                <View style={styles.emptyContainer}>
                  <View style={styles.emptyIconContainer}>
                    <FontAwesome5 name="clipboard-list" size={48} color={COLORS.primary} />
                  </View>
                  <Text style={styles.emptyTitle}>No hay registros disponibles</Text>
                  <Text style={styles.emptySubtitle}>Ajusta los filtros o registra un nuevo servicio</Text>
                </View>
              }
              scrollEnabled={false} // Usamos ScrollView padre
            />
          </>
        )}
      </ScrollView>

      {/* SimpleDatePicker JS universal */}
      <SimpleDatePicker
        value={fechaInicio}
        onChange={onChangeFecha}
        visible={pickerVisible !== null}
        onClose={() => setPickerVisible(null)}
        title={pickerVisible === 'inicio' ? 'Selecciona la fecha de inicio' : 'Selecciona la fecha final'}
      />

      {/* Modal de Evidencias */}
      <Modal
        visible={evidenciasModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setEvidenciasModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Evidencias</Text>
              <TouchableOpacity onPress={() => setEvidenciasModalVisible(false)}>
                <FontAwesome5 name="times" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            {cargandoEvidencias ? (
              <View style={styles.modalLoading}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.modalLoadingText}>Cargando evidencias...</Text>
              </View>
            ) : evidenciasActuales.length === 0 ? (
              <View style={styles.modalEmpty}>
                <FontAwesome5 name="image" size={48} color={COLORS.textSecondary} />
                <Text style={styles.modalEmptyText}>No hay evidencias para este registro</Text>
              </View>
            ) : (
              <ScrollView style={styles.modalScroll}>
                <View style={styles.evidenciasGrid}>
                  {evidenciasActuales.map((evidencia, index) => (
                    <View key={evidencia.id} style={styles.evidenciaCard}>
                      <Image
                        source={{ uri: evidencia.urlEvidencia }}
                        style={styles.evidenciaImagen}
                        resizeMode="cover"
                      />
                      <View style={styles.evidenciaInfo}>
                        <Text style={styles.evidenciaNombre} numberOfLines={1}>
                          {evidencia.nombreArchivo}
                        </Text>
                        <TouchableOpacity
                          style={styles.evidenciaVerButton}
                          onPress={() => Linking.openURL(evidencia.urlEvidencia)}
                        >
                          <FontAwesome5 name="external-link-alt" size={12} color={COLORS.primary} />
                          <Text style={styles.evidenciaVerText}>Abrir</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
    dateChip: {
      flexDirection: 'column',
      alignItems: 'flex-start',
      backgroundColor: COLORS.surface,
      borderRadius: RADIUS.lg,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm,
      borderWidth: 1,
      borderColor: COLORS.border,
      marginRight: SPACING.xs,
    },
    chipLabel: {
      fontSize: FONT_SIZE.xs,
      color: COLORS.textSecondary,
      marginBottom: 2,
      fontWeight: FONT_WEIGHT.semibold,
    },
    chipValue: {
      fontSize: FONT_SIZE.md,
      color: COLORS.text,
      fontWeight: FONT_WEIGHT.bold,
    },
  container: { 
    ...commonStyles.container,
    padding: SPACING.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  headerAddButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.primary,
  },
  filtrosTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xxl,
    gap: SPACING.md,
  },
  loadingText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
  },
  emptyContainer: {
    padding: SPACING.xxl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primarySurface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  emptyTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },

  tableContainer: {
    marginBottom: SPACING.lg,
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
  },
  tableTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    marginBottom: SPACING.sm,
    color: COLORS.text,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.xs,
    borderBottomWidth: 0.5,
    borderColor: COLORS.border,
  },
  cellNombre: { fontSize: FONT_SIZE.sm, color: COLORS.text },
  cellCantidad: { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.semibold, color: COLORS.info },
  consolidadoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: 0,
  },
  consolidadoPersona: {
    width: '50%',
    minWidth: 0,
    marginBottom: SPACING.sm,
    padding: SPACING.sm,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  consolidadoHeader: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  consolidadoNombre: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.text,
  },
  consolidadoTotal: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.textSecondary,
  },
  consolidadoTotalDebajo: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  consolidadoServicios: {
    paddingLeft: SPACING.md,
  },
  consolidadoServicioItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.sm,
    marginBottom: SPACING.xs,
  },
  consolidadoServicioNombre: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    flex: 1,
  },
  consolidadoServicioCantidad: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.success,
    minWidth: 25,
    textAlign: 'right',
  },

  item: {
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  itemTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.text,
    flex: 1,
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  itemDetails: {
    flex: 1,
    gap: SPACING.xs,
  },
  itemDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  itemDetailText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  formaPagoEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.sm,
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  formaPagoLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginRight: SPACING.sm,
  },
  formaPagoCancelButton: {
    marginLeft: SPACING.sm,
    padding: SPACING.xs,
  },
  formaPagoCancelText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,
  },
  editIcon: {
    color: COLORS.info,
    fontSize: FONT_SIZE.xs,
  },
  badges: {
    flexDirection: 'row',
    gap: SPACING.sm,
    flexWrap: 'wrap',
  },
  badge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.md,
  },
  badgeConfirmado: {
    backgroundColor: COLORS.success,
  },
  badgeLiquidado: {
    backgroundColor: COLORS.info,
  },
  badgeText: {
    color: COLORS.white,
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.semibold,
  },
  confirmContainer: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    marginLeft: SPACING.sm,
  },
  filtros: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  dateRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginBottom: SPACING.lg,
    marginTop: SPACING.sm,
  },
  filtroSection: {
    marginBottom: SPACING.md,
  },
  filtrosTopRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.md,
    alignItems: 'flex-end',
  },
  filtrosBottomRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  fechasContainer: {
    flex: 1,
  },
  filtroColumn: {
    flex: 1,
    minWidth: 200,
  },
  filtroLabel: {
    fontWeight: FONT_WEIGHT.semibold,
    marginBottom: SPACING.sm,
    color: COLORS.text,
  },
  fechasRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  fechaLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  inputFecha: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    backgroundColor: COLORS.white,
    fontSize: FONT_SIZE.sm,
  },
  btnBuscar: {
    backgroundColor: COLORS.primary,
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  btnBuscarCompact: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100,
    ...SHADOWS.primary,
  },
  btnBuscarText: {
    color: COLORS.white,
    fontWeight: FONT_WEIGHT.semibold,
    fontSize: FONT_SIZE.sm,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  chip: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  chipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: {
    color: COLORS.text,
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.semibold,
  },
  chipTextActive: {
    color: COLORS.white,
  },
  emptyText: {
    textAlign: 'center',
    color: COLORS.textSecondary,
    paddingVertical: SPACING.sm,
  },
  confirmButton: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderWidth: 2,
    borderColor: COLORS.info,
  },
  confirmButtonLoading: {
    opacity: 0.6,
  },
  confirmButtonText: {
    color: COLORS.info,
    fontWeight: FONT_WEIGHT.bold,
    fontSize: FONT_SIZE.xs,
  },
  formaPagoOption: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    marginRight: SPACING.sm,
  },
  formaPagoOptionActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  formaPagoOptionText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.text,
    fontWeight: FONT_WEIGHT.semibold,
  },
  formaPagoOptionTextActive: {
    color: COLORS.white,
  },
  evidenciasButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.xs,
    marginTop: SPACING.sm,
  },
  evidenciasButtonText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.primary,
    fontWeight: FONT_WEIGHT.semibold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    width: '90%',
    maxWidth: 600,
    maxHeight: '80%',
    ...SHADOWS.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.text,
  },
  modalLoading: {
    padding: SPACING.xxl,
    alignItems: 'center',
    gap: SPACING.md,
  },
  modalLoadingText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  modalEmpty: {
    padding: SPACING.xxl,
    alignItems: 'center',
    gap: SPACING.md,
  },
  modalEmptyText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  modalScroll: {
    maxHeight: 500,
  },
  evidenciasGrid: {
    padding: SPACING.lg,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  evidenciaCard: {
    width: '48%',
    minWidth: 150,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    ...SHADOWS.sm,
  },
  evidenciaImagen: {
    width: '100%',
    height: 150,
    backgroundColor: COLORS.border,
  },
  evidenciaInfo: {
    padding: SPACING.sm,
  },
  evidenciaNombre: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  evidenciaVerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  evidenciaVerText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.primary,
    fontWeight: FONT_WEIGHT.semibold,
  },
});
