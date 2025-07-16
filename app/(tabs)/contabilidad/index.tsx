import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    View
} from 'react-native';
import { api } from '../../api/api';

type PagoPersona = {
  nombrePersona: string;
  totalPagado: number;
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
            <View key={index} style={styles.card}>
              <Text style={styles.nombre}>👤 {pago.nombrePersona}</Text>
              <Text style={styles.monto}>💵 Total: ${pago.totalPagado.toFixed(0)}</Text>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  card: {
    backgroundColor: '#dfe6e9',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  nombre: { fontSize: 16, fontWeight: '500' },
  monto: { fontSize: 16, color: '#2d3436' },
});
