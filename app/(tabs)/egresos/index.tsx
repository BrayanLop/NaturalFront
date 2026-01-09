import EmptyState from '@/components/EmptyState';
import ListCard from '@/components/ListCard';
import LoadingView from '@/components/LoadingView';
import { COLORS } from '@/constants/theme';
import { useAuth } from '@/context/authContext';
import { formatCurrency, formatDate, toDateInputValue } from '@/utils/formatters';
import { logger, showError } from '@/utils/logger';
import { isAdmin } from '@/utils/roles';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    FlatList,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { api } from '../../api/api';
import { EgresoEmpresa } from '../../api/modelos/egreso';

export default function ListaEgresos() {
  const router = useRouter();
  const { usuario } = useAuth();
  const [egresos, setEgresos] = useState<EgresoEmpresa[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [fechaInicio, setFechaInicio] = useState(() => {
    const today = new Date();
    const start = new Date(today);
    start.setDate(start.getDate() - 30);
    return toDateInputValue(start);
  });
  const [fechaFin, setFechaFin] = useState(() => toDateInputValue(new Date()));

  const esAdmin = isAdmin(usuario?.rol);

  const cargarEgresos = useCallback(async () => {
    if (!esAdmin) return;
    
    setLoading(true);
    try {
      const response = await api.get('/EgresosEmpresa/ObtenerEgresosPorRango', {
        params: {
          fechaInicio,
          fechaFin,
        },
      });
      setEgresos(response.data || []);
    } catch (error: any) {
      logger.error('Error al cargar egresos:', error);
      showError('No se pudieron cargar los egresos');
    } finally {
      setLoading(false);
    }
  }, [esAdmin, fechaInicio, fechaFin]);

  useEffect(() => {
    cargarEgresos();
  }, []);

  const totalEgresos = useMemo(
    () => egresos.reduce((acc, item) => acc + (item.valorEgreso || 0), 0),
    [egresos]
  );

  const handleCrear = useCallback(() => {
    router.push('/(tabs)/egresos/crear');
  }, [router]);

  const renderItem = useCallback(
    ({ item }: { item: EgresoEmpresa }) => (
      <ListCard
        title={item.nombrePersona || 'Sin persona'}
        subtitle={`💵 ${formatCurrency(item.valorEgreso)}`}
        description={item.motivo || 'Sin motivo'}
        rightContent={
          <Text style={styles.fecha}>
            {item.fechaRegistro ? formatDate(item.fechaRegistro) : 'Sin fecha'}
          </Text>
        }
      />
    ),
    []
  );

  const keyExtractor = useCallback((item: EgresoEmpresa, index: number) => `${item.empresaId}-${item.personaId}-${index}`, []);

  const emptyComponent = useMemo(
    () => <EmptyState message="No hay egresos en el rango seleccionado" icon="💸" />,
    []
  );

  if (!esAdmin) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No tienes permisos para ver esta sección</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.filtros}>
        <Text style={styles.label}>Rango de fechas</Text>
        <View style={styles.row}>
          <View style={styles.dateInputBox}>
            <Text style={styles.chipLabel}>Desde</Text>
            {Platform.OS === 'web' ? (
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                style={styles.webDateInput as any}
              />
            ) : (
              <Text style={styles.dateValue}>{fechaInicio}</Text>
            )}
          </View>
          <View style={styles.dateInputBox}>
            <Text style={styles.chipLabel}>Hasta</Text>
            {Platform.OS === 'web' ? (
              <input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                style={styles.webDateInput as any}
              />
            ) : (
              <Text style={styles.dateValue}>{fechaFin}</Text>
            )}
          </View>
        </View>

        <TouchableOpacity style={styles.buscarButton} onPress={cargarEgresos} disabled={loading}>
          <Text style={styles.buscarText}>{loading ? 'Buscando...' : 'Buscar'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.resumen}>
        <Text style={styles.resumenLabel}>Total egresos en rango</Text>
        <Text style={styles.resumenMonto}>{formatCurrency(totalEgresos)}</Text>
      </View>

      {loading ? (
        <LoadingView />
      ) : (
        <FlatList
          data={egresos}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          ListEmptyComponent={emptyComponent}
        />
      )}

      <TouchableOpacity style={styles.addButton} onPress={handleCrear}>
        <Text style={styles.addText}>+ Registrar egreso</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: COLORS.surface },
  filtros: {
    backgroundColor: COLORS.cardBackground,
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    gap: 8,
  },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  dateInputBox: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#dfe6e9',
  },
  chipLabel: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 4 },
  dateValue: { fontSize: 14, color: COLORS.text },
  webDateInput: {
    borderWidth: 0,
    padding: 4,
    fontSize: 14,
    width: '100%',
  },
  buscarButton: {
    backgroundColor: COLORS.primary,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buscarText: { color: COLORS.white, fontWeight: 'bold', fontSize: 16 },
  resumen: {
    backgroundColor: '#fee5e5',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d6303133',
  },
  resumenLabel: { color: '#2d3436', fontWeight: '600' },
  resumenMonto: { color: '#d63031', fontWeight: 'bold', fontSize: 16 },
  fecha: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  addButton: {
    marginTop: 16,
    backgroundColor: COLORS.primary,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  addText: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  errorText: {
    textAlign: 'center',
    marginTop: 24,
    color: COLORS.textSecondary,
  },
});
