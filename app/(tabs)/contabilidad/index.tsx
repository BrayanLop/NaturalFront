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
import { formatCurrency } from '@/utils/formatters';

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
                  <View style={styles.cardHeader}>
                    <Text style={styles.nombre}>🧑 {pago.nombrePersona}</Text>
                    {pago.totalSinConfirmar > 0 && (
                      <View style={styles.pendingBadge}>
                        <Text style={styles.pendingBadgeText}>Pendiente</Text>
                      </View>
                    )}
                  </View>
                  
                  <View style={styles.totalesContainer}>
                    <View style={styles.totalBox}>
                      <Text style={styles.totalLabel}>Total</Text>
                      <Text style={styles.totalMonto}>{formatCurrency(pago.totalPagado)}</Text>
                    </View>
                    {pago.totalSinConfirmar > 0 && (
                      <View style={styles.sinConfirmarBox}>
                        <Text style={styles.sinConfirmarLabel}>Sin confirmar</Text>
                        <Text style={styles.sinConfirmarMonto}>{formatCurrency(pago.totalSinConfirmar)}</Text>
                      </View>
                    )}
                  </View>
                  
                  <View style={styles.serviciosContainer}>
                    <Text style={styles.serviciosTitle}>Servicios realizados</Text>
                    {pago.servicios.map((servicio, idx) => (
                      <View key={idx} style={styles.servicioItem}>
                        <Text style={styles.servicioPunto}>•</Text>
                        <Text style={styles.servicioNombre}>{servicio.nombre}</Text>
                        <Text style={styles.servicioCantidad}>{servicio.cantidad}</Text>
                      </View>
                    ))}
                  </View>
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
    backgroundColor: '#e9ecef',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ced4da',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  nombre: { 
    fontSize: 16, 
    fontWeight: 'bold',
    color: '#2d3436',
    flex: 1,
  },
  pendingBadge: {
    backgroundColor: '#fff3cd',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ffc107',
  },
  pendingBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#856404',
  },
  totalesContainer: { 
    flexDirection: 'row', 
    gap: 8,
    marginBottom: 12,
  },
  totalBox: {
    flex: 1,
    backgroundColor: '#e8f8f2',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#00b894',
  },
  totalLabel: {
    fontSize: 11,
    color: '#636e72',
    marginBottom: 4,
    fontWeight: '500',
  },
  totalMonto: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00b894',
  },
  sinConfirmarBox: {
    flex: 1,
    backgroundColor: '#fff8e1',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#ffc107',
  },
  sinConfirmarLabel: {
    fontSize: 11,
    color: '#636e72',
    marginBottom: 4,
    fontWeight: '500',
  },
  sinConfirmarMonto: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f39c12',
  },
  serviciosContainer: {
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    paddingTop: 12,
  },
  serviciosTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#636e72',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  servicioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
    marginBottom: 4,
  },
  servicioPunto: {
    fontSize: 14,
    color: '#00b894',
    marginRight: 8,
  },
  servicioNombre: {
    fontSize: 14,
    color: '#2d3436',
    flex: 1,
  },
  servicioCantidad: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00b894',
    minWidth: 30,
    textAlign: 'right',
  },
});
