import EmptyState from '@/components/EmptyState';
import ListCard from '@/components/ListCard';
import LoadingView from '@/components/LoadingView';
import SimpleDatePicker from '@/components/SimpleDatePicker';
import { COLORS } from '@/constants/theme';
import { useAuth } from '@/context/authContext';
import { formatCurrency, formatDate, toDateInputValue } from '@/utils/formatters';
import { logger, showError } from '@/utils/logger';
import { isAdmin } from '@/utils/roles';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
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
  const [pickerVisible, setPickerVisible] = useState<null | 'inicio' | 'fin'>(null);

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
        <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#2d3436', marginBottom: 10 }}>Filtrar por fechas</Text>
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
          <TouchableOpacity style={[styles.dateChip, { flex: 1 }]} onPress={() => setPickerVisible('inicio')}>
            <Text style={styles.chipLabel}>Desde</Text>
            <Text style={styles.chipValue}>{fechaInicio}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.dateChip, { flex: 1 }]} onPress={() => setPickerVisible('fin')}>
            <Text style={styles.chipLabel}>Hasta</Text>
            <Text style={styles.chipValue}>{fechaFin}</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.buscarButton} onPress={cargarEgresos} disabled={loading}>
          <Text style={styles.buscarText}>{loading ? 'Buscando...' : 'Buscar'}</Text>
        </TouchableOpacity>
      </View>

      {/* Pickers para dispositivos móviles */}
      <SimpleDatePicker
        value={fechaInicio}
        onChange={(dateStr) => { setFechaInicio(dateStr); setPickerVisible(null); }}
        visible={pickerVisible === 'inicio'}
        onClose={() => setPickerVisible(null)}
        title="Selecciona la fecha desde"
      />
      <SimpleDatePicker
        value={fechaFin}
        onChange={(dateStr) => { setFechaFin(dateStr); setPickerVisible(null); }}
        visible={pickerVisible === 'fin'}
        onClose={() => setPickerVisible(null)}
        title="Selecciona la fecha hasta"
      />

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
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#dfe6e9',
  },
  dateChip: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    backgroundColor: '#f1f2f6',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#dfe6e9',
  },
  chipLabel: {
    fontSize: 12,
    color: '#636e72',
    marginBottom: 2,
    fontWeight: '600',
  },
  chipValue: {
    fontSize: 15,
    color: '#2d3436',
    fontWeight: 'bold',
  },
  buscarButton: {
    backgroundColor: '#00b894',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  buscarText: { color: '#fff', fontWeight: '600', fontSize: 14 },
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
