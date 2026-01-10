import { useAuth } from "@/context/authContext";
import { isAdmin } from "@/utils/roles";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, FlatList, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { api } from "../../../api/api";

type ServicioDetalleItem = {
  nombreServicio: string;
  hora: string;
  confirmado?: boolean;
  registroServicioId?: number;
  RegistroServicioId?: number;
  valorTrabajador?: number;
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
  const puedeActualmenteLiquidar = usuario?.rol === '01'; // Solo admin 01 puede liquidar
  const puedeConfirmar = isAdmin(usuario?.rol); // Solo admin 01 y 03 pueden confirmar

  const [detalle, setDetalle] = useState<DetalleServicioPorDiaViewModel[]>([]);
  const empresaId = 1; // ⚡ Aquí pones la empresa actual o tomas de un estado global/contexto

  const [loadingLiquidar, setLoadingLiquidar] = useState(false);
  const [totalPorLiquidar, setTotalPorLiquidar] = useState<number | null>(null);
  const [cargandoTotal, setCargandoTotal] = useState(false);
  const [confirmandoServicio, setConfirmandoServicio] = useState<number | null>(null);

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
        console.error("❌ Error cargando detalle", e);
        Alert.alert("Error", "No se pudo cargar el detalle de servicios.");
      }
    };
    fetchData();
  }, [personaId]);

const handleLiquidar = async () => {
  if (!personaId) {
    alert("ID de persona no disponible.");
    return;
  }

  const personaIdNum = parseInt(personaId as string, 10);

  // Confirmación según plataforma
  let confirmar = false;
  if (Platform.OS === "web") {
    confirmar = window.confirm("¿Está seguro de que desea liquidar a esta persona?");
    if (!confirmar) return;
  } else {
    confirmar = await new Promise<boolean>((resolve) => {
      Alert.alert(
        "Confirmar liquidación",
        "¿Está seguro de que desea liquidar a esta persona?",
        [
          { text: "Cancelar", onPress: () => resolve(false), style: "cancel" },
          { text: "Liquidar", onPress: () => resolve(true), style: "destructive" },
        ]
      );
    });
    if (!confirmar) return;
  }

  // ✅ Aquí se ejecuta la liquidación
  setLoadingLiquidar(true);
  try {
    console.log("📤 Enviando POST a /Contabilidad/LiquidarPersona?personaId=" + personaIdNum);
    const response = await api.post(
      `/Contabilidad/LiquidarPersona?personaId=${personaIdNum}`,
      {},
      { headers: { empresaId: empresaId.toString() } }
    );
    console.log("✅ Respuesta exitosa:", response.data);
    if (Platform.OS === "web") {
      window.alert("Persona liquidada correctamente.");
      router.back();
    } else {
      Alert.alert("Éxito", "Persona liquidada correctamente.");
      router.back();
    }
  } catch (e: any) {
    console.error("❌ Error liquidando persona:", e);
    if (Platform.OS === "web") {
      window.alert(e?.response?.data?.message || "No se pudo liquidar la persona.");
    } else {
      Alert.alert("Error", e?.response?.data?.message || "No se pudo liquidar la persona.");
    }
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
    console.log("🔵 handleConfirmarServicio llamado con ID:", registroServicioId);
    
    if (!registroServicioId) {
      console.error("❌ registroServicioId es undefined o null");
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
      console.log("📤 Enviando PATCH a /RegistroServicio/ActualizarConfirmado/" + registroServicioId + "?confirmado=true");
      const response = await api.patch(
        `/RegistroServicio/ActualizarConfirmado/${registroServicioId}?confirmado=true`,
        {},
        { headers: { empresaId: empresaId.toString() } }
      );
      console.log("✅ Respuesta PATCH:", response.data);
      
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
      console.error("❌ Error confirmando servicio:", e);
      if (Platform.OS === "web") {
        window.alert(e?.response?.data?.message || "No se pudo confirmar el servicio.");
      } else {
        Alert.alert("Error", e?.response?.data?.message || "No se pudo confirmar el servicio.");
      }
    } finally {
      setConfirmandoServicio(null);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.resumen}>
        <Text style={styles.resumenLabel}>Total por liquidar</Text>
        <Text style={styles.resumenMonto}>{cargandoTotal ? "Calculando..." : formatMonto(totalPorLiquidar ?? 0)}</Text>
      </View>
      {puedeActualmenteLiquidar && (
        Platform.OS === "web" ? (
          <div style={{ marginBottom: 16 }}>
            <button
              className="btn btn-primary"
              onClick={handleLiquidar}
              disabled={loadingLiquidar}
              style={{ width: "100%" }}
            >
              {loadingLiquidar ? "Liquidando..." : "Liquidar"}
            </button>
          </div>
        ) : (
          <TouchableOpacity
            style={[styles.liquidarButton, loadingLiquidar && styles.liquidarButtonDisabled]}
            onPress={handleLiquidar}
            disabled={loadingLiquidar}
          >
            <Text style={styles.liquidarButtonText}>
              {loadingLiquidar ? "Liquidando..." : "Liquidar"}
            </Text>
          </TouchableOpacity>
        )
      )}

      {detalle.length === 0 ? (
        <Text style={styles.emptyText}>No hay detalle disponible.</Text>
      ) : (
        <FlatList
          data={detalle}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.fecha}>{formatFecha(item.fecha)}</Text>
              <Text style={styles.total}>
                Total de servicios: {item.totalServicios}
              </Text>

              {item.servicios.map((s, i) => (
                <View key={i} style={styles.servicioItem}>
                  <View style={styles.servicioContent}>
                    <Text style={styles.hora}>{formatHora(s.hora)} ⏰</Text>
                    <Text style={styles.nombre}>{s.nombreServicio}</Text>
                    <Text style={styles.valor}>💰 {formatMonto(s.valorTrabajador)}</Text>
                  </View>
                  <View style={styles.estadoContainer}>
                    {!s.confirmado && puedeConfirmar && (
                      <TouchableOpacity
                        style={[styles.confirmButton, confirmandoServicio === (s.registroServicioId || s.RegistroServicioId) && styles.confirmButtonLoading]}
                        onPress={() => {
                          const id = s.registroServicioId || s.RegistroServicioId;
                          console.log("🟡 TouchableOpacity presionado. ID:", id);
                          handleConfirmarServicio(id);
                        }}
                        disabled={confirmandoServicio === (s.registroServicioId || s.RegistroServicioId)}
                      >
                        <Text style={styles.confirmButtonText}>
                          {confirmandoServicio === (s.registroServicioId || s.RegistroServicioId) ? "..." : "Confirmar"}
                        </Text>
                      </TouchableOpacity>
                    )}
                    {s.confirmado && (
                      <Text style={styles.estadoConfirmado}>✓ Confirmado</Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f8f9fa",
  },
  emptyText: {
    textAlign: "center",
    marginTop: 30,
    fontSize: 16,
    color: "#6c757d",
  },
  card: {
    backgroundColor: "#e9ecef",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#ced4da",
  },
  fecha: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 6,
    color: "#212529",
  },
  total: {
    fontSize: 14,
    marginBottom: 10,
    color: "#495057",
  },
  servicioItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    padding: 12,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#0d6efd",
  },
  servicioContent: {
    flex: 1,
  },
  hora: {
    fontSize: 14,
    fontWeight: "600",
    marginRight: 8,
    color: "#0d6efd",
  },
  nombre: {
    fontSize: 14,
    color: "#212529",
  },
  valor: {
    fontSize: 13,
    color: "#27ae60",
    fontWeight: "600",
    marginTop: 4,
  },
  estadoContainer: {
    flexDirection: "column",
    alignItems: "flex-end",
    marginLeft: 8,
  },
  estadoText: {
    fontSize: 12,
    color: "#e17055",
    fontWeight: "600",
    marginBottom: 4,
  },
  estadoConfirmado: {
    color: "#00b894",
    fontWeight: "600",
    fontSize: 12,
  },
  confirmButton: {
    backgroundColor: "#0d6efd",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#0d6efd",
  },
  confirmButtonLoading: {
    opacity: 0.6,
  },
  confirmButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 12,
  },
  liquidarButton: {
    backgroundColor: "#dc3545",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 16,
  },
  liquidarButtonDisabled: {
    backgroundColor: "#2592a3ff",
    opacity: 0.6,
  },
  liquidarButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  resumen: {
    backgroundColor: "#e8f8f2",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#00b89433",
  },
  resumenLabel: { color: "#2d3436", fontWeight: "600" },
  resumenMonto: { color: "#00b894", fontWeight: "bold", fontSize: 16 },
});
