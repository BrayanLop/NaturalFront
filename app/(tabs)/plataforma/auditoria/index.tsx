import EmptyState from '@/components/EmptyState';
import FormField from '@/components/FormField';
import ListCard from '@/components/ListCard';
import LoadingView from '@/components/LoadingView';
import PrimaryButton from '@/components/PrimaryButton';
import StatusBadge from '@/components/StatusBadge';
import { COLORS, FONT_SIZE, FONT_WEIGHT, RADIUS, SPACING, commonStyles } from '@/constants/theme';
import { mensajeDeError } from '@/utils/apiError';
import { logger, showError } from '@/utils/logger';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TextInput, View } from 'react-native';
import { AuditoriaItem, PaginaAuditoria } from '../../../api/modelos/empresaPlataforma';
import { plataformaApi } from '../../../api/plataformaApi';

const TAMANO = 25;
const FECHA = /^\d{4}-\d{2}-\d{2}$/;

const TIPO_RESULTADO = { ok: 'confirmado', error: 'rechazado', pendiente: 'pendiente' } as const;

export default function Auditoria() {
  const [empresaId, setEmpresaId] = useState('');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [items, setItems] = useState<AuditoriaItem[]>([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [cargando, setCargando] = useState(false);
  const [cargandoMas, setCargandoMas] = useState(false);
  // Evita que una respuesta lenta de una búsqueda anterior pise a la más reciente.
  const busqueda = useRef(0);

  const consultar = useCallback(
    async (paginaPedida: number, filtros = { empresaId, desde, hasta }) => {
      const id = ++busqueda.current;
      paginaPedida === 1 ? setCargando(true) : setCargandoMas(true);
      try {
        const params: Record<string, string | number> = { pagina: paginaPedida, tamano: TAMANO };
        if (filtros.empresaId) params.empresaId = Number(filtros.empresaId);
        if (filtros.desde) params.desde = filtros.desde;
        if (filtros.hasta) params.hasta = filtros.hasta;

        const res: PaginaAuditoria = (await plataformaApi.get('/Auditoria', { params })).data;
        if (id !== busqueda.current) return;
        setItems((prev) => (paginaPedida === 1 ? res.items : [...prev, ...res.items]));
        setTotal(res.total);
        setPagina(paginaPedida);
      } catch (error) {
        logger.error('Error al consultar auditoría:', error);
        if (id === busqueda.current) showError(mensajeDeError(error, 'No se pudo consultar la auditoría'));
      } finally {
        if (id === busqueda.current) {
          setCargando(false);
          setCargandoMas(false);
        }
      }
    },
    [empresaId, desde, hasta]
  );

  useEffect(() => {
    consultar(1);
  }, []);

  const buscar = () => {
    if (empresaId && !/^\d+$/.test(empresaId)) return showError('La empresa debe ser un número');
    if ((desde && !FECHA.test(desde)) || (hasta && !FECHA.test(hasta))) {
      return showError('Las fechas deben tener el formato AAAA-MM-DD');
    }
    if (desde && hasta && desde > hasta) return showError("'Desde' no puede ser posterior a 'Hasta'");
    consultar(1);
  };

  const cargarMas = () => {
    if (cargando || cargandoMas || items.length >= total) return;
    consultar(pagina + 1);
  };

  const renderItem = ({ item }: { item: AuditoriaItem }) => (
    <ListCard
      title={item.accion}
      subtitle={`${new Date(item.fechaUtc).toLocaleString('es-CO')} · ${item.actorNombre}`}
      description={[item.empresaId ? `Empresa ${item.empresaId}` : null, item.usuarioId ? `Usuario ${item.usuarioId}` : null, item.detalle]
        .filter(Boolean)
        .join(' · ')}
      badges={<StatusBadge label={item.resultado} type={TIPO_RESULTADO[item.resultado] ?? 'info'} />}
    />
  );

  return (
    <View style={styles.container}>
      <View style={styles.filtros}>
        <View style={styles.fila}>
          <View style={styles.col}>
            <FormField label="Empresa (id)">
              <TextInput value={empresaId} onChangeText={setEmpresaId} style={commonStyles.input} placeholder="Todas" keyboardType="numeric" placeholderTextColor={COLORS.textTertiary} />
            </FormField>
          </View>
          <View style={styles.col}>
            <FormField label="Desde">
              <TextInput value={desde} onChangeText={setDesde} style={commonStyles.input} placeholder="AAAA-MM-DD" autoCapitalize="none" placeholderTextColor={COLORS.textTertiary} />
            </FormField>
          </View>
          <View style={styles.col}>
            <FormField label="Hasta">
              <TextInput value={hasta} onChangeText={setHasta} style={commonStyles.input} placeholder="AAAA-MM-DD" autoCapitalize="none" placeholderTextColor={COLORS.textTertiary} />
            </FormField>
          </View>
        </View>
        <PrimaryButton title="Buscar" onPress={buscar} loading={cargando} size="small" />
        {!cargando && <Text style={styles.total}>{total} registro{total !== 1 ? 's' : ''}</Text>}
      </View>

      {cargando && items.length === 0 ? (
        <LoadingView message="Consultando..." />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => String(i.id)}
          renderItem={renderItem}
          onEndReached={cargarMas}
          onEndReachedThreshold={0.4}
          ListEmptyComponent={<EmptyState message="Sin registros" icon="📋" subtitle="No hay acciones con esos filtros" />}
          ListFooterComponent={cargandoMas ? <ActivityIndicator style={{ margin: SPACING.lg }} color={COLORS.primary} /> : null}
          contentContainerStyle={items.length === 0 ? styles.emptyList : undefined}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: SPACING.lg, backgroundColor: COLORS.background },
  filtros: { backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.md, gap: SPACING.sm },
  fila: { flexDirection: 'row', gap: SPACING.sm },
  col: { flex: 1 },
  total: { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.medium, color: COLORS.textSecondary },
  emptyList: { flex: 1, justifyContent: 'center' },
});
