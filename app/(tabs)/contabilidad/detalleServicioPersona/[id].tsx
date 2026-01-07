import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, FlatList, StyleSheet, Text, View } from "react-native";
import { api } from "../../../api/api";

type ServicioDetalleItem = {
  nombreServicio: string;
  hora: string;
};

type DetalleServicioPorDiaViewModel = {
  fecha: string;
  totalServicios: number;
  servicios: ServicioDetalleItem[];
};

export default function DetallePersona() {
  const { id } = useLocalSearchParams();
  const personaId = Array.isArray(id) ? id[0] : id;

  const [detalle, setDetalle] = useState<DetalleServicioPorDiaViewModel[]>([]);
  const empresaId = 1; // ⚡ Aquí pones la empresa actual, o la tomas de un estado global/contexto

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
        setDetalle(res.data);
      } catch (e) {
        console.error("❌ Error cargando detalle", e);
        Alert.alert("Error", "No se pudo cargar el detalle de servicios.");
      }
    };
    fetchData();
  }, [personaId]);

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

  return (
    <View style={styles.container}>
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
                  <Text style={styles.hora}>{formatHora(s.hora)} ⏰</Text>
                  <Text style={styles.nombre}>{s.nombreServicio}</Text>
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
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
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
    marginBottom: 6,
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
});
