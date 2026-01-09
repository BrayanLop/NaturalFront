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
  totalSinConfirmar: number;
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
      <Link href="/contabilidad/historico" asChild>
        <TouchableOpacity style={styles.historicoButton}>
          <Text style={styles.historicoText}>📅 Histórico liquidaciones</Text>
        </TouchableOpacity>
      </Link>

      {loading ? (
        <ActivityIndicator size="large" color="#00b894" />
      ) : pagos.length === 0 ? (
        <View style={{ padding: 40, alignItems: 'center' }}>
          <Text style={{ fontSize: 48, marginBottom: 16 }}>📊</Text>
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#2d3436' }}>No hay pagos recientes</Text>
        </View>
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
                  <View style={styles.totalesContainer}>
                    <Text style={styles.monto}>
                      💵 Total: ${pago.totalPagado.toFixed(0)}
                    </Text>
                    <Text style={styles.montoSinConfirmar}>
                      ⏳ Sin confirmar: ${pago.totalSinConfirmar.toFixed(0)}
                    </Text>
                  </View>
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
  historicoButton: {
    backgroundColor: '#00b894',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  historicoText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  card: {
    backgroundColor: '#dfe6e9',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  nombre: { fontSize: 16, fontWeight: 'bold' },
  totalesContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10, gap: 10 },
  monto: { fontSize: 15, color: '#2d3436', flex: 1 },
  montoSinConfirmar: { fontSize: 15, color: '#e17055', flex: 1, fontWeight: '600' },
  servicio: { fontSize: 14, color: '#636e72' },
});
