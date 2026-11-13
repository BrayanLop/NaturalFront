import SimpleDatePicker from '@/components/SimpleDatePicker';
import { EmptyState, LoadingState, PageHeader } from '@/components/ds';
import { ConsolidadoRegistros } from '@/components/registro/ConsolidadoRegistros';
import { FiltrosRegistros } from '@/components/registro/FiltrosRegistros';
import { ModalRechazo, ModalSubirEvidencia, ModalVerEvidencias } from '@/components/registro/ModalesRegistro';
import { TarjetaRegistro } from '@/components/registro/TarjetaRegistro';
import type { CampoFecha, ConsolidadoPersona, EstadoFiltro, FormaPagoFiltro } from '@/components/registro/tipos';
import { useSubirEvidenciaRegistro } from '@/components/registro/useSubirEvidenciaRegistro';
import { useAuth } from '@/context/authContext';
import { SPACING, useEstilos, type Tema } from '@/theme';
import { toDateInputValue } from '@/utils/formatters';
import { logger, showConfirm, showError, showSuccess } from '@/utils/logger';
import { isAdmin, puedeRegistrarServicios } from '@/utils/roles';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, ScrollView, View } from 'react-native';
import { api } from '../../api/api';
import { Persona } from '../../api/modelos/persona';
import { Evidencia, RegistroServicio } from '../../api/modelos/registroServicio';

export default function ListaRegistros() {
  const router = useRouter();
  const { usuario } = useAuth();
  const estilos = useEstilos(crearEstilos);
  const [registros, setRegistros] = useState<RegistroServicio[]>([]);
  const [loading, setLoading] = useState(false);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [personaFiltro, setPersonaFiltro] = useState<string>('');
  const [estadoFiltro, setEstadoFiltro] = useState<EstadoFiltro>('todos');
  const [formaPagoFiltro, setFormaPagoFiltro] = useState<FormaPagoFiltro>('todos');
  const [confirmandoId, setConfirmandoId] = useState<number | null>(null);
  const [rechazandoId, setRechazandoId] = useState<number | null>(null);
  const [marcandoPropinaId, setMarcandoPropinaId] = useState<number | null>(null);

  // Estado para el modal de rechazo
  const [registroParaRechazar, setRegistroParaRechazar] = useState<RegistroServicio | null>(null);
  const [motivoRechazo, setMotivoRechazo] = useState('');
  const [editandoFormaPagoId, setEditandoFormaPagoId] = useState<number | null>(null);
  const [actualizandoFormaPago, setActualizandoFormaPago] = useState(false);

  // Estado para ver evidencias
  const [evidenciasModalVisible, setEvidenciasModalVisible] = useState(false);
  const [evidenciasActuales, setEvidenciasActuales] = useState<Evidencia[]>([]);
  const [cargandoEvidencias, setCargandoEvidencias] = useState(false);

  // Fechas por defecto: día actual
  const fechaActual = toDateInputValue(new Date()); // YYYY-MM-DD local
  const [fechaInicio, setFechaInicio] = useState<string>(fechaActual);
  const [fechaFin, setFechaFin] = useState<string>(fechaActual);
  const [pickerVisible, setPickerVisible] = useState<null | CampoFecha>(null);

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
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [usuario])
  );

  const subirEvidencia = useSubirEvidenciaRegistro(cargarDatos);

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
          // Aprobados: confirmados y no rechazados
          if (!item.confirmado || item.rechazado) return false;
          break;
        case 'noLiquidados':
          if (item.liquidado) return false;
          break;
        case 'noConfirmados':
          // Pendientes: ni confirmado, ni liquidado, ni rechazado
          if (item.confirmado || item.liquidado || item.rechazado) return false;
          break;
        case 'rechazados':
          if (!item.rechazado) return false;
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
  const consolidado = useMemo<ConsolidadoPersona[]>(() => {
    const consolidadoMap = new Map<
      number,
      { nombrePersona: string; servicios: Map<string, { nombreServicio: string; cantidad: number }> }
    >();

    registrosFiltrados.forEach((registro: any) => {
      const personaId = registro.personaId;
      const nombrePersona = registro.nombrePersona || 'Sin nombre';
      const nombreServicio = registro.nombreServicio || 'Sin servicio';

      if (!consolidadoMap.has(personaId)) {
        consolidadoMap.set(personaId, { nombrePersona, servicios: new Map() });
      }

      const persona = consolidadoMap.get(personaId)!;
      if (persona.servicios.has(nombreServicio)) {
        persona.servicios.get(nombreServicio)!.cantidad++;
      } else {
        persona.servicios.set(nombreServicio, { nombreServicio, cantidad: 1 });
      }
    });

    return Array.from(consolidadoMap.values()).map((item) => ({
      nombrePersona: item.nombrePersona,
      servicios: Array.from(item.servicios.values()),
    }));
  }, [registrosFiltrados]);

  const handleConfirmarRegistro = useCallback(
    async (registroServicioId: number) => {
      if (!puedeEditar) return;

      const confirmar = await showConfirm('¿Desea aprobar este registro?', 'Aprobar registro');
      if (!confirmar) return;

      setConfirmandoId(registroServicioId);
      try {
        await api.patch(
          `/RegistroServicio/ActualizarConfirmado/${registroServicioId}?confirmado=true`,
          {},
          { headers: { empresaId: '1' } }
        );

        // Actualizar solo el registro afectado en el estado local, sin recargar toda la lista
        setRegistros((prev) =>
          prev.map((r) => (r.id === registroServicioId ? { ...r, confirmado: true, rechazado: false } : r))
        );
        showSuccess('Registro aprobado correctamente');
      } catch (e: any) {
        logger.error('Error aprobando registro:', e);
        showError(e?.response?.data?.message || 'No se pudo aprobar el registro');
      } finally {
        setConfirmandoId(null);
      }
    },
    [puedeEditar]
  );

  const confirmarRechazo = useCallback(async () => {
    if (!puedeEditar || !registroParaRechazar) return;

    const registroServicioId = registroParaRechazar.id;
    const motivo = motivoRechazo.trim();
    setRechazandoId(registroServicioId);
    try {
      await api.patch(
        `/RegistroServicio/Rechazar/${registroServicioId}?motivo=${encodeURIComponent(motivo)}`,
        {},
        { headers: { empresaId: '1' } }
      );

      setRegistros((prev) =>
        prev.map((r) =>
          r.id === registroServicioId ? { ...r, confirmado: false, rechazado: true, motivoRechazo: motivo } : r
        )
      );
      showSuccess('Registro rechazado');
      setRegistroParaRechazar(null);
      setMotivoRechazo('');
    } catch (e: any) {
      logger.error('Error rechazando registro:', e);
      showError(e?.response?.data?.message || 'No se pudo rechazar el registro');
    } finally {
      setRechazandoId(null);
    }
  }, [puedeEditar, registroParaRechazar, motivoRechazo]);

  const handleMarcarPropina = useCallback(
    async (registroServicioId: number, pagada: boolean) => {
      if (!puedeEditar) return;

      setMarcandoPropinaId(registroServicioId);
      try {
        await api.patch(
          `/RegistroServicio/MarcarPropinaPagada/${registroServicioId}?pagada=${pagada}`,
          {},
          { headers: { empresaId: '1' } }
        );

        setRegistros((prev) =>
          prev.map((r) =>
            r.id === registroServicioId
              ? { ...r, propinaPagada: pagada, fechaPropinaPagada: pagada ? new Date().toISOString() : undefined }
              : r
          )
        );
        showSuccess(pagada ? 'Propina marcada como entregada' : 'Propina marcada como pendiente');
      } catch (e: any) {
        logger.error('Error actualizando propina:', e);
        showError(e?.response?.data?.message || 'No se pudo actualizar la propina');
      } finally {
        setMarcandoPropinaId(null);
      }
    },
    [puedeEditar]
  );

  const handleActualizarFormaPago = useCallback(
    async (registroServicioId: number, formaPago: 'T' | 'E') => {
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
    },
    [puedeEditar, cargarDatos]
  );

  const verEvidencias = useCallback(async (registro: any) => {
    setCargandoEvidencias(true);
    setEvidenciasModalVisible(true);

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

  // Adaptadores de las acciones de cada tarjeta (mismo efecto que los onPress originales)
  const abrirRechazo = useCallback((registro: RegistroServicio) => {
    setRegistroParaRechazar(registro);
    setMotivoRechazo('');
  }, []);
  const cerrarRechazo = useCallback(() => {
    setRegistroParaRechazar(null);
    setMotivoRechazo('');
  }, []);
  const aprobar = useCallback((r: RegistroServicio) => handleConfirmarRegistro(r.id), [handleConfirmarRegistro]);
  const marcarPropina = useCallback(
    (r: RegistroServicio) => handleMarcarPropina(r.id, !r.propinaPagada),
    [handleMarcarPropina]
  );
  const editarFormaPago = useCallback((r: RegistroServicio | null) => setEditandoFormaPagoId(r ? r.id : null), []);
  const actualizarFormaPago = useCallback(
    (r: RegistroServicio, formaPago: 'T' | 'E') => handleActualizarFormaPago(r.id, formaPago),
    [handleActualizarFormaPago]
  );
  const abrirSubirEvidencia = subirEvidencia.abrir;

  const renderItem = useCallback(
    ({ item }: { item: RegistroServicio }) => (
      <TarjetaRegistro
        item={item}
        puedeEditar={puedeEditar}
        confirmando={confirmandoId === item.id}
        rechazando={rechazandoId === item.id}
        marcandoPropina={marcandoPropinaId === item.id}
        editandoFormaPago={editandoFormaPagoId === item.id}
        actualizandoFormaPago={actualizandoFormaPago}
        onAprobar={aprobar}
        onRechazar={abrirRechazo}
        onMarcarPropina={marcarPropina}
        onEditarFormaPago={editarFormaPago}
        onActualizarFormaPago={actualizarFormaPago}
        onVerEvidencias={verEvidencias}
        onSubirEvidencia={abrirSubirEvidencia}
      />
    ),
    [
      puedeEditar,
      confirmandoId,
      rechazandoId,
      marcandoPropinaId,
      editandoFormaPagoId,
      actualizandoFormaPago,
      aprobar,
      abrirRechazo,
      marcarPropina,
      editarFormaPago,
      actualizarFormaPago,
      verEvidencias,
      abrirSubirEvidencia,
    ]
  );

  const keyExtractor = useCallback((item: RegistroServicio) => item.id.toString(), []);

  const irARegistrar = () => {
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
  };

  // Handler del selector de fecha
  const onChangeFecha = (dateStr?: string) => {
    if (!dateStr || !pickerVisible) return;
    if (pickerVisible === 'inicio') setFechaInicio(dateStr);
    if (pickerVisible === 'fin') setFechaFin(dateStr);
    setPickerVisible(null);
  };

  const total = registrosFiltrados.length;

  return (
    <View style={estilos.pantalla}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={estilos.contenido}>
        <PageHeader
          title={`${total} registro${total !== 1 ? 's' : ''}`}
          action={{ icon: 'add', onPress: irARegistrar, label: 'Registrar servicio' }}
        />

        <FiltrosRegistros
          fechaInicio={fechaInicio}
          fechaFin={fechaFin}
          fechaPorDefecto={fechaActual}
          onElegirFecha={setPickerVisible}
          onBuscar={cargarDatos}
          buscando={loading}
          mostrarPersona={puedeEditar}
          personas={personas}
          personaFiltro={personaFiltro}
          onPersonaFiltro={setPersonaFiltro}
          estadoFiltro={estadoFiltro}
          onEstadoFiltro={setEstadoFiltro}
          formaPagoFiltro={formaPagoFiltro}
          onFormaPagoFiltro={setFormaPagoFiltro}
        />

        {loading ? (
          <LoadingState message="Cargando registros..." />
        ) : (
          <>
            <ConsolidadoRegistros consolidado={consolidado} />
            <FlatList
              data={registrosFiltrados}
              keyExtractor={keyExtractor}
              renderItem={renderItem}
              ListEmptyComponent={
                <EmptyState
                  icon="clipboard-outline"
                  title="No hay registros disponibles"
                  subtitle="Ajusta los filtros o registra un nuevo servicio"
                />
              }
              scrollEnabled={false} // Usamos ScrollView padre
            />
          </>
        )}
      </ScrollView>

      <SimpleDatePicker
        value={fechaInicio}
        onChange={onChangeFecha}
        visible={pickerVisible !== null}
        onClose={() => setPickerVisible(null)}
        title={pickerVisible === 'inicio' ? 'Selecciona la fecha de inicio' : 'Selecciona la fecha final'}
      />

      <ModalSubirEvidencia
        visible={subirEvidencia.visible}
        registro={subirEvidencia.registro}
        archivos={subirEvidencia.archivos}
        subiendo={subirEvidencia.subiendo}
        onClose={subirEvidencia.cerrar}
        onCamara={subirEvidencia.tomarFoto}
        onGaleria={subirEvidencia.seleccionarImagen}
        onArchivo={subirEvidencia.seleccionarDocumento}
        onQuitar={subirEvidencia.eliminarArchivo}
        onConfirmar={subirEvidencia.confirmar}
      />

      <ModalVerEvidencias
        visible={evidenciasModalVisible}
        cargando={cargandoEvidencias}
        evidencias={evidenciasActuales}
        onClose={() => setEvidenciasModalVisible(false)}
      />

      <ModalRechazo
        registro={registroParaRechazar}
        motivo={motivoRechazo}
        onChangeMotivo={setMotivoRechazo}
        rechazando={rechazandoId !== null}
        onClose={cerrarRechazo}
        onConfirmar={confirmarRechazo}
      />
    </View>
  );
}

const crearEstilos = (t: Tema) => ({
  pantalla: { flex: 1, backgroundColor: t.colores.fondo },
  contenido: { padding: SPACING.lg, paddingBottom: SPACING.huge },
});
