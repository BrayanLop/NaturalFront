import { useAuth } from "@/context/authContext";
import { isAdmin } from "@/utils/roles";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, FlatList, Platform, Pressable, View } from "react-native";
import { AppText, Badge, Button, Card, Divider, EmptyState, Icon } from "@/components/ds";
import { RADIUS, SPACING, useEstilos, useTheme, type Tema } from "@/theme";
import { api, apiWithRetry } from "../../../api/api";
import {
  LiquidarPersonaRequest,
  LiquidarPersonaResponse,
  PagoLiquidacion,
  ResumenLiquidacion,
} from "../../../api/modelos/contabilidad";
import { EgresoEmpresa } from "../../../api/modelos/egreso";
import ResumenLiquidacionModal from "@/components/ResumenLiquidacionModal";
import { formatFormaPago } from "@/utils/formatters";
import { logger } from '@/utils/logger';

type ServicioDetalleItem = {
  nombreServicio: string;
  hora: string;
  confirmado?: boolean;
  registroServicioId?: number;
  RegistroServicioId?: number;
  valorTrabajador?: number;
  propina?: number;
  propinaPagada?: boolean;
};

type DetalleServicioPorDiaViewModel = {
  fecha: string;
  totalServicios: number;
  servicios: ServicioDetalleItem[];
  LiquidacionServicios?: number;
  liquidacionServicios?: number;
};

export default function DetallePersona() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const personaId = Array.isArray(id) ? id[0] : id;
  const { usuario } = useAuth();
  const estilos = useEstilos(crearEstilos);
  const { tema } = useTheme();
  const puedeActualmenteLiquidar = usuario?.rol === '01'; // Solo admin 01 puede liquidar
  const puedeConfirmar = isAdmin(usuario?.rol); // Solo admin 01 y 03 pueden confirmar

  const [detalle, setDetalle] = useState<DetalleServicioPorDiaViewModel[]>([]);
  const empresaId = 1; // Aquí pones la empresa actual o tomas de un estado global/contexto

  const [loadingLiquidar, setLoadingLiquidar] = useState(false);
  const [totalPorLiquidar, setTotalPorLiquidar] = useState<number | null>(null);
  const [cargandoTotal, setCargandoTotal] = useState(false);
  const [confirmandoServicio, setConfirmandoServicio] = useState<number | null>(null);
  const [marcandoPropina, setMarcandoPropina] = useState<number | null>(null);
  
  // Estados para egresos
  const [egresos, setEgresos] = useState<EgresoEmpresa[]>([]);
  const [egresosSeleccionados, setEgresosSeleccionados] = useState<number[]>([]);
  const [cargandoEgresos, setCargandoEgresos] = useState(false);

  // Paso de resumen de liquidación
  const [resumenVisible, setResumenVisible] = useState(false);
  const [cargandoResumen, setCargandoResumen] = useState(false);
  const [resumen, setResumen] = useState<ResumenLiquidacion | null>(null);
  const [errorResumen, setErrorResumen] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!personaId) return;
      try {
        const res = await api.get(
          `Contabilidad/DetalleServiciosPorPersona/${personaId}`,
          {
            headers: {
              empresaId: empresaId.toString(),
            },
          }
        );
        const data = res.data as any;
        const items: DetalleServicioPorDiaViewModel[] = Array.isArray(data)
          ? data
          : (data?.detalle ?? data?.detalles ?? data?.items ?? data?.registros ?? data?.dias ?? data?.servicios ?? []);
        
        // Debug: Ver qué propiedades vienen en los servicios
        if (items.length > 0 && items[0].servicios.length > 0) {
          const firstService = items[0].servicios[0];
        }
        
        setDetalle(items);
        // Sumar LiquidacionServicios de todos los items
        setCargandoTotal(true);
        try {
          const total = items.reduce((acc, it) => {
            const raw = (it?.LiquidacionServicios ?? it?.liquidacionServicios ?? 0) as any;
            if (typeof raw === 'string') {
              const cleaned = raw
                .replace(/[^0-9.,-]/g, '')
                .replace(/,(?=\d{2}$)/, '.')
                .replace(/\.(?=.*\.)/g, '');
              return acc + (Number(cleaned) || 0);
            }
            return acc + (Number(raw) || 0);
          }, 0);
          setTotalPorLiquidar(total);
        } finally {
          setCargandoTotal(false);
        }
      } catch (e) {
        logger.error("Error cargando detalle", e);
        Alert.alert("Error", "No se pudo cargar el detalle de servicios.");
      }
    };
    fetchData();
  }, [personaId]);

  // Cargar egresos de la persona
  useEffect(() => {
    const fetchEgresos = async () => {
      if (!personaId) return;
      setCargandoEgresos(true);
      try {
        const res = await api.get(
          `EgresosEmpresa/ObtenerEgresosPorPersona?personaId=${personaId}`,
          {
            headers: {
              empresaId: empresaId.toString(),
            },
          }
        );
        const data = res.data;
        setEgresos(Array.isArray(data) ? data : []);
      } catch (e) {
        logger.error("Error cargando egresos", e);
      } finally {
        setCargandoEgresos(false);
      }
    };
    fetchEgresos();
  }, [personaId]);

  // Toggle selección de egreso
  const toggleEgresoSeleccionado = (egresoId: number) => {
    setEgresosSeleccionados((prev) => {
      if (prev.includes(egresoId)) {
        return prev.filter((id) => id !== egresoId);
      } else {
        return [...prev, egresoId];
      }
    });
  };

  // Calcular total de egresos seleccionados
  const totalEgresosSeleccionados = egresos
    .filter((egreso) => egresosSeleccionados.includes(egreso.egresoId))
    .reduce((acc, egreso) => acc + egreso.valorEgreso, 0);

  // Calcular total neto (total por liquidar - egresos seleccionados)
  const totalNeto = (totalPorLiquidar ?? 0) - totalEgresosSeleccionados;

  // Total de propinas aún no entregadas de esta persona (en el período mostrado)
  const totalPropinasPendientes = detalle.reduce(
    (acc, dia) =>
      acc +
      dia.servicios.reduce(
        (a, s) => a + ((s.propina ?? 0) > 0 && !s.propinaPagada ? (s.propina ?? 0) : 0),
        0
      ),
    0
  );

  const handleMarcarPropina = async (registroServicioId: number | undefined, pagada: boolean) => {
    if (!registroServicioId || !puedeConfirmar) return;
    setMarcandoPropina(registroServicioId);
    try {
      // PATCH idempotente: reintenta automáticamente ante errores de red
      // (conexiones keep-alive muertas del proxy) para evitar falsos "error" cuando el servidor sí guardó.
      await apiWithRetry(() =>
        api.patch(
          `/RegistroServicio/MarcarPropinaPagada/${registroServicioId}?pagada=${pagada}`,
          {},
          { headers: { empresaId: empresaId.toString() } }
        )
      );
      setDetalle((prev) =>
        prev.map((dia) => ({
          ...dia,
          servicios: dia.servicios.map((s) =>
            (s.registroServicioId || s.RegistroServicioId) === registroServicioId
              ? { ...s, propinaPagada: pagada }
              : s
          ),
        }))
      );
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'No se pudo confirmar la propina. Verifica si ya quedó marcada como entregada.';
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Error', msg);
    } finally {
      setMarcandoPropina(null);
    }
  };

  // Mensaje de error del back: puede venir como texto plano (400) o como { message }
  const mensajeError = (data: unknown, porDefecto: string): string => {
    if (typeof data === "string" && data.trim()) return data;
    const msg = (data as { message?: string; title?: string } | undefined)?.message;
    return msg || porDefecto;
  };

  const mostrarMensaje = (titulo: string, mensaje: string) => {
    if (Platform.OS === "web") window.alert(mensaje);
    else Alert.alert(titulo, mensaje);
  };

  const egresosQuery = () =>
    egresosSeleccionados.length > 0 ? `egresosId=${egresosSeleccionados.join(",")}` : "";

  // Paso 1: abrir el resumen (vista previa) de la liquidación con los egresos seleccionados
  const handleLiquidar = async () => {
    if (!puedeActualmenteLiquidar) return; // Solo admin 01 puede liquidar
    if (!personaId) {
      mostrarMensaje("Error", "ID de persona no disponible.");
      return;
    }
    setResumen(null);
    setErrorResumen(null);
    setResumenVisible(true);
    setCargandoResumen(true);
    try {
      const query = egresosQuery();
      const res = await api.get<ResumenLiquidacion>(
        `Contabilidad/ResumenLiquidacion/${personaId}${query ? `?${query}` : ""}`,
        { headers: { empresaId: empresaId.toString() } }
      );
      if (res.status >= 400) throw { response: res };
      setResumen(res.data);
    } catch (e: any) {
      logger.error("Error cargando resumen de liquidación", e);
      setErrorResumen(mensajeError(e?.response?.data, "No se pudo calcular el resumen de la liquidación."));
    } finally {
      setCargandoResumen(false);
    }
  };

  // Paso 2: confirmar la liquidación con el reparto del pago
  const confirmarLiquidacion = async (pagos: PagoLiquidacion[]) => {
    if (!personaId || !puedeActualmenteLiquidar) return;
    const personaIdNum = parseInt(personaId as string, 10);
    setLoadingLiquidar(true);
    try {
      const query = egresosQuery();
      const url = `/Contabilidad/LiquidarPersona?personaId=${personaIdNum}${query ? `&${query}` : ""}`;
      const body: LiquidarPersonaRequest = pagos.length > 0 ? { pagos } : {};
      logger.log("Enviando POST a", url, body);
      const response = await api.post<LiquidarPersonaResponse>(url, body, {
        headers: { empresaId: empresaId.toString() },
      });
      // En modo demo el interceptor resuelve también las respuestas 4xx
      if (response.status >= 400) throw { response };
      logger.log("Respuesta exitosa:", response.data);
      setResumenVisible(false);
      const idLiquidacion = response.data?.idLiquidacion;
      if (idLiquidacion) {
        router.replace(`/contabilidad/comprobante/${idLiquidacion}` as any);
        return;
      }
      mostrarMensaje("Éxito", "Persona liquidada correctamente.");
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace("/(tabs)/contabilidad");
      }
    } catch (e: any) {
      logger.error("Error liquidando persona:", e);
      mostrarMensaje("Error", mensajeError(e?.response?.data, "No se pudo liquidar la persona."));
    } finally {
      setLoadingLiquidar(false);
    }
  };

  const formatFecha = (fecha: string) => {
    const date = new Date(fecha);
    return date.toLocaleDateString("es-CO", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  };

  const formatHora = (hora: string) => {
    const date = new Date(hora);
    return date.toLocaleTimeString("es-CO", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatMonto = (valor?: number) => {
    if (valor == null) return "$0.00";
    return valor.toLocaleString("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const handleConfirmarServicio = async (registroServicioId?: number) => {
    logger.log("handleConfirmarServicio llamado con ID:", registroServicioId);
    
    if (!registroServicioId) {
      logger.error("registroServicioId es undefined o null");
      Alert.alert("Error", "No se puede confirmar este servicio.");
      return;
    }

    let confirmar = false;
    if (Platform.OS === "web") {
      confirmar = window.confirm("¿Desea confirmar este servicio?");
      if (!confirmar) return;
    } else {
      confirmar = await new Promise<boolean>((resolve) => {
        Alert.alert(
          "Confirmar servicio",
          "¿Desea confirmar este servicio?",
          [
            { text: "Cancelar", onPress: () => resolve(false), style: "cancel" },
            { text: "Confirmar", onPress: () => resolve(true), style: "default" },
          ]
        );
      });
      if (!confirmar) return;
    }

    setConfirmandoServicio(registroServicioId);
    try {
      logger.log("Enviando PATCH a /RegistroServicio/ActualizarConfirmado/" + registroServicioId + "?confirmado=true");
      // PATCH idempotente: reintenta automáticamente ante errores de red para evitar falsos "error" cuando el servidor sí guardó.
      const response = await apiWithRetry(() =>
        api.patch(
          `/RegistroServicio/ActualizarConfirmado/${registroServicioId}?confirmado=true`,
          {},
          { headers: { empresaId: empresaId.toString() } }
        )
      );
      logger.log("Respuesta PATCH:", response.data);
      
      // Recargar datos después de confirmar
      const res = await api.get(
        `Contabilidad/DetalleServiciosPorPersona/${personaId}`,
        {
          headers: {
            empresaId: empresaId.toString(),
          },
        }
      );
      const data = res.data as any;
      const items: DetalleServicioPorDiaViewModel[] = Array.isArray(data)
        ? data
        : (data?.detalle ?? data?.detalles ?? data?.items ?? data?.registros ?? data?.dias ?? data?.servicios ?? []);
      setDetalle(items);
      
      // Recalcular total después de confirmar
      const total = items.reduce((acc, it) => {
        const raw = (it?.LiquidacionServicios ?? it?.liquidacionServicios ?? 0) as any;
        if (typeof raw === 'string') {
          const cleaned = raw
            .replace(/[^0-9.,-]/g, '')
            .replace(/,(?=\d{2}$)/, '.')
            .replace(/\.(?=.*\.)/g, '');
          return acc + (Number(cleaned) || 0);
        }
        return acc + (Number(raw) || 0);
      }, 0);
      setTotalPorLiquidar(total);
      
      if (Platform.OS === "web") {
        window.alert("Servicio confirmado correctamente.");
      } else {
        Alert.alert("Éxito", "Servicio confirmado correctamente.");
      }
    } catch (e: any) {
      logger.error("Error confirmando servicio:", e);
      if (Platform.OS === "web") {
        window.alert(e?.response?.data?.message || "No se pudo confirmar el servicio.");
      } else {
        Alert.alert("Error", e?.response?.data?.message || "No se pudo confirmar el servicio.");
      }
    } finally {
      setConfirmandoServicio(null);
    }
  };

  const ListHeader = (
    <>
      <Card variant="tinted">
        <AppText variante="etiqueta" tono="primario">
          Total por liquidar
        </AppText>
        <AppText variante="titulo" tono="primario" numberOfLines={1} adjustsFontSizeToFit>
          {cargandoTotal ? "Calculando..." : formatMonto(totalPorLiquidar ?? 0)}
        </AppText>

        {totalPropinasPendientes > 0 && (
          <View style={estilos.resumenLinea}>
            <View style={estilos.resumenEtiqueta}>
              <Icon name="gift-outline" size={16} color={tema.colores.avisoTexto} />
              <AppText variante="etiqueta" tono="suave" style={estilos.textoConIcono}>
                Propinas pendientes
              </AppText>
            </View>
            <AppText variante="etiqueta" tono="aviso">
              {formatMonto(totalPropinasPendientes)}
            </AppText>
          </View>
        )}

        {totalEgresosSeleccionados > 0 && (
          <>
            <View style={estilos.resumenLinea}>
              <AppText variante="etiqueta" tono="suave" style={estilos.resumenEtiqueta}>
                Egresos a descontar
              </AppText>
              <AppText variante="etiqueta" tono="error">
                - {formatMonto(totalEgresosSeleccionados)}
              </AppText>
            </View>
            <Divider style={estilos.separador} />
            <View style={estilos.resumenLinea}>
              <AppText variante="subtitulo" style={estilos.resumenEtiqueta}>
                Total neto
              </AppText>
              <AppText variante="subtitulo" tono={totalNeto < 0 ? "error" : "primario"}>
                {formatMonto(totalNeto)}
              </AppText>
            </View>
          </>
        )}
      </Card>

      {/* Sección de Egresos */}
      {egresos.length > 0 && (
        <Card>
          <View style={estilos.encabezadoSeccion}>
            <Icon name="trending-down-outline" size={18} color={tema.colores.errorTexto} />
            <AppText variante="subtitulo" style={estilos.textoConIcono}>
              Egresos a descontar
            </AppText>
          </View>
          {cargandoEgresos ? (
            <AppText tono="suave" style={estilos.centrado}>
              Cargando egresos...
            </AppText>
          ) : (
            egresos.map((egreso) => {
              const seleccionado = egresosSeleccionados.includes(egreso.egresoId);
              return (
                <Pressable
                  key={egreso.egresoId}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: seleccionado }}
                  accessibilityLabel={`${egreso.motivo} ${formatMonto(egreso.valorEgreso)}`}
                  style={[estilos.egresoItem, seleccionado && estilos.egresoItemActivo]}
                  onPress={() => toggleEgresoSeleccionado(egreso.egresoId)}
                >
                  <View style={[estilos.checkbox, seleccionado && estilos.checkboxActivo]}>
                    {seleccionado && <Icon name="checkmark" size={16} color={tema.colores.sobrePrimario} />}
                  </View>
                  <View style={estilos.egresoInfo}>
                    <AppText variante="etiqueta">{egreso.motivo}</AppText>
                    <AppText variante="etiqueta" tono="error">
                      {formatMonto(egreso.valorEgreso)}
                    </AppText>
                    <AppText variante="nota" tono="suave">
                      {formatFormaPago(egreso.formaPago)}
                      {egreso.fechaRegistro ? ` · ${new Date(egreso.fechaRegistro).toLocaleDateString('es-CO')}` : ""}
                    </AppText>
                  </View>
                </Pressable>
              );
            })
          )}
          {egresosSeleccionados.length > 0 && (
            <AppText variante="nota" tono="primario" style={estilos.centrado}>
              {egresosSeleccionados.length} egreso(s) seleccionado(s)
            </AppText>
          )}
        </Card>
      )}

      {puedeActualmenteLiquidar && (
        <View style={estilos.liquidar}>
          <Button
            title={loadingLiquidar ? "Liquidando..." : "Liquidar"}
            icon="checkmark-done-outline"
            onPress={handleLiquidar}
            disabled={loadingLiquidar}
          />
        </View>
      )}
    </>
  );

  return (
    <View style={estilos.contenedor}>
      <FlatList
        data={detalle}
        keyExtractor={(item, index) => index.toString()}
        ListHeaderComponent={ListHeader}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={estilos.lista}
        ListEmptyComponent={
          <EmptyState icon="receipt-outline" title="No hay detalle disponible" />
        }
        renderItem={({ item }) => (
          <Card style={estilos.diaCard}>
            <View style={estilos.diaCabecera}>
              <AppText variante="subtitulo" style={estilos.diaFecha}>
                {formatFecha(item.fecha)}
              </AppText>
              <Badge label={`${item.totalServicios} servicio${item.totalServicios === 1 ? "" : "s"}`} tone="primary" dot={false} size="sm" />
            </View>

            {item.servicios.map((s, i) => {
              const servicioId = s.registroServicioId || s.RegistroServicioId;
              return (
                <View key={i} style={[estilos.servicioItem, i > 0 && estilos.servicioSeparado]}>
                  <View style={estilos.servicioContent}>
                    <AppText variante="etiqueta" numberOfLines={2}>
                      {s.nombreServicio}
                    </AppText>
                    <View style={estilos.metaFila}>
                      <Icon name="time-outline" size={14} color={tema.colores.textoSuave} />
                      <AppText variante="nota" tono="suave" style={estilos.textoConIcono}>
                        {formatHora(s.hora)}
                      </AppText>
                      <View style={estilos.metaSeparador} />
                      <Icon name="cash-outline" size={14} color={tema.colores.exitoTexto} />
                      <AppText variante="nota" tono="exito" style={[estilos.textoConIcono, estilos.valor]}>
                        {formatMonto(s.valorTrabajador)}
                      </AppText>
                    </View>
                    {(s.propina ?? 0) > 0 && (
                      <View style={estilos.propinaContainer}>
                        <Icon name="gift-outline" size={14} color={tema.colores.avisoTexto} />
                        <AppText variante="nota" tono="aviso" style={estilos.textoConIcono}>
                          Propina: {formatMonto(s.propina)}
                        </AppText>
                        {s.propinaPagada ? (
                          <Badge label="Entregada" tone="success" size="sm" />
                        ) : puedeConfirmar ? (
                          <Button
                            title={marcandoPropina === servicioId ? "..." : "Confirmar propina"}
                            size="sm"
                            variant="secondary"
                            fullWidth={false}
                            onPress={() => handleMarcarPropina(servicioId, true)}
                            disabled={marcandoPropina === servicioId}
                          />
                        ) : (
                          <Badge label="Pendiente" tone="warning" size="sm" />
                        )}
                      </View>
                    )}
                  </View>
                  <View style={estilos.estadoContainer}>
                    {!s.confirmado && puedeConfirmar && (
                      <Button
                        title={confirmandoServicio === servicioId ? "..." : "Confirmar"}
                        size="sm"
                        fullWidth={false}
                        onPress={() => {
                          logger.log("Confirmar servicio. ID:", servicioId);
                          handleConfirmarServicio(servicioId);
                        }}
                        disabled={confirmandoServicio === servicioId}
                      />
                    )}
                    {s.confirmado && <Badge label="Confirmado" tone="success" size="sm" />}
                  </View>
                </View>
              );
            })}
          </Card>
        )}
      />

      {puedeActualmenteLiquidar && (
        <ResumenLiquidacionModal
          visible={resumenVisible}
          cargando={cargandoResumen}
          resumen={resumen}
          error={errorResumen}
          liquidando={loadingLiquidar}
          onCerrar={() => setResumenVisible(false)}
          onConfirmar={confirmarLiquidacion}
        />
      )}
    </View>
  );
}

const crearEstilos = (t: Tema) => ({
  contenedor: { flex: 1, padding: SPACING.lg, backgroundColor: t.colores.fondo },
  lista: { paddingBottom: SPACING.huge },
  separador: { marginVertical: SPACING.sm },
  resumenLinea: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    marginTop: SPACING.sm,
  },
  resumenEtiqueta: { flex: 1, minWidth: 0, flexDirection: "row" as const, alignItems: "center" as const, marginRight: SPACING.sm },
  textoConIcono: { marginLeft: SPACING.xs },
  encabezadoSeccion: { flexDirection: "row" as const, alignItems: "center" as const, marginBottom: SPACING.md },
  centrado: { textAlign: "center" as const, marginTop: SPACING.sm },
  egresoItem: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    backgroundColor: t.colores.superficie,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: t.colores.borde,
    minHeight: 56,
  },
  egresoItemActivo: { borderColor: t.colores.primarioFuerte, backgroundColor: t.colores.primarioSuave },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: t.colores.bordeFuerte,
    borderRadius: RADIUS.sm,
    marginRight: SPACING.md,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    backgroundColor: t.colores.superficie,
  },
  checkboxActivo: { backgroundColor: t.colores.primarioFuerte, borderColor: t.colores.primarioFuerte },
  egresoInfo: { flex: 1, minWidth: 0 },
  liquidar: { marginBottom: SPACING.lg },
  diaCard: { marginBottom: SPACING.lg },
  diaCabecera: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    marginBottom: SPACING.sm,
  },
  diaFecha: { flex: 1, minWidth: 0, marginRight: SPACING.sm },
  servicioItem: { flexDirection: "row" as const, alignItems: "center" as const, paddingVertical: SPACING.md },
  servicioSeparado: { borderTopWidth: 1, borderTopColor: t.colores.divisor },
  servicioContent: { flex: 1, minWidth: 0 },
  metaFila: { flexDirection: "row" as const, alignItems: "center" as const, marginTop: SPACING.xs },
  metaSeparador: { width: SPACING.md },
  valor: { fontWeight: "600" as const },
  propinaContainer: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    flexWrap: "wrap" as const,
    gap: SPACING.xs,
    marginTop: SPACING.sm,
  },
  estadoContainer: { alignItems: "flex-end" as const, marginLeft: SPACING.sm },
});
