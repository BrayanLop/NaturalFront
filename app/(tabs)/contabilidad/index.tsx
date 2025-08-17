import { Link, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { api } from '../../api/api';

type ServicioRealizado = {
  nombre: string;
  cantidad: number;
};

type PagoPersona = {
  personaId: number;
  nombrePersona: string;
  totalPagado: number;
  servicios: ServicioRealizado[];
};

export default function PagosPorPersona() {
  const [pagos, setPagos] = useState<PagoPersona[]>([]);
  const [loading, setLoading] = useState(false);

  const cargarPagos = async () => {
    setLoading(true);
    try {
      const response = await api.get('Contabilidad/PagosUltimosDias');
      setPagos(response.data);
    } catch (error) {
      console.error('❌ Error al cargar pagos:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      cargarPagos();
    }, [])
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#00b894" />
      ) : pagos.length === 0 ? (
        <Text>No hay pagos recientes.</Text>
      ) : (
        <ScrollView>
          {pagos.map((pago, index) => (
          <Link
              key={index}
              href={`/contabilidad/detalleServicioPersona/${pago.personaId}`}
              asChild
            >
              <TouchableOpacity>
                <View style={styles.card}>
                  <Text style={styles.nombre}>👤 {pago.nombrePersona}</Text>
                  <Text style={styles.monto}>
                    💵 Total: ${pago.totalPagado.toFixed(0)}
                  </Text>
                  {pago.servicios.map((servicio, idx) => (
                    <Text key={idx} style={styles.servicio}>
                      - {servicio.nombre}: {servicio.cantidad}
                    </Text>
                  ))}
                </View>
              </TouchableOpacity>
          </Link>))}
        </ScrollView>)}
    </View>);
  }

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  card: {
    backgroundColor: '#dfe6e9',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  nombre: { fontSize: 16, fontWeight: 'bold' },
  monto: { fontSize: 15, color: '#2d3436', marginBottom: 10 },
  servicio: { fontSize: 14, color: '#636e72' },
});
