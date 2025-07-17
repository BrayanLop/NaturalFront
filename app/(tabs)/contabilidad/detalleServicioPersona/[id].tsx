import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { api } from '../../../api/api';

type ServicioDetalleItem = {
  nombreServicio: string;
  hora: string; // o Date
};

type DetalleServicioPorDia = {
  fecha: string; // ISO date
  totalServicios: number;
  servicios: ServicioDetalleItem[];
};

export default function DetallePersona() {
  const { id } = useLocalSearchParams();
  const [detalle, setDetalle] = useState<DetalleServicioPorDia[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get(`Contabilidad/DetalleServiciosPorPersona/${id}`);
        setDetalle(res.data);
      } catch (e) {
        console.error('Error cargando detalle', e);
      }
    };
    fetchData();
  }, [id]);

  return (
    <ScrollView style={{ padding: 20 }}>
      {detalle.map((dia, i) => (
        <View key={i} style={styles.card}>
          <Text style={styles.fecha}>📅 {new Date(dia.fecha).toLocaleDateString()}</Text>
          <Text style={styles.total}>Total servicios: {dia.totalServicios}</Text>
          {dia.servicios.map((s, j) => (
            <Text key={j}>• {s.nombreServicio} - {new Date(s.hora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#f1f2f6', padding: 15, borderRadius: 10, marginBottom: 10 },
  fecha: { fontWeight: 'bold', fontSize: 16, marginBottom: 5 },
  total: { marginBottom: 5 }
});
