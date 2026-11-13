import { AppText, Badge, Button, Card, EmptyState, Input, ListRow, LoadingState, type TonoBadge } from '@/components/ds';
import { SPACING, useEstilos, useTheme, type Tema } from '@/theme';
import { mensajeDeError } from '@/utils/apiError';
import { logger, showError } from '@/utils/logger';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, View } from 'react-native';
import { AuditoriaItem, PaginaAuditoria } from '../../../api/modelos/empresaPlataforma';
import { plataformaApi } from '../../../api/plataformaApi';

const TAMANO = 25;
const FECHA = /^\d{4}-\d{2}-\d{2}$/;

const RESULTADO: Record<string, { tono: TonoBadge; label: string }> = {
  ok: { tono: 'success', label: 'Correcto' },
  error: { tono: 'error', label: 'Error' },
  pendiente: { tono: 'warning', label: 'Pendiente' },
};

const crearEstilos = (t: Tema) => ({
  container: { flex: 1, padding: SPACING.lg, backgroundColor: t.colores.fondo },
  fila: { flexDirection: 'row' as const, gap: SPACING.md },
  campoFila: { flex: 1, minWidth: 0, marginBottom: SPACING.md },
  emptyList: { flexGrow: 1, justifyContent: 'center' as const },
});

export default function Auditoria() {
  const estilos = useEstilos(crearEstilos);
  const { tema } = useTheme();
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

  const renderItem = ({ item }: { item: AuditoriaItem }) => {
    const detalle = [item.empresaId ? `Empresa ${item.empresaId}` : null, item.usuarioId ? `Usuario ${item.usuarioId}` : null, item.detalle]
      .filter(Boolean)
      .join(' · ');
    const r = RESULTADO[item.resultado] ?? { tono: 'neutral' as TonoBadge, label: item.resultado };
    return (
      <ListRow
        title={item.accion}
        subtitle={`${new Date(item.fechaUtc).toLocaleString('es-CO')} · ${item.actorNombre}${detalle ? `\n${detalle}` : ''}`}
        icon="document-text-outline"
        badge={<Badge label={r.label} tone={r.tono} size="sm" />}
      />
    );
  };

  return (
    <View style={estilos.container}>
      <Card>
        <Input
          label="Empresa (id)"
          value={empresaId}
          onChangeText={setEmpresaId}
          placeholder="Todas"
          keyboardType="numeric"
          leftIcon="business-outline"
        />
        <View style={estilos.fila}>
          <Input
            label="Desde"
            value={desde}
            onChangeText={setDesde}
            placeholder="AAAA-MM-DD"
            autoCapitalize="none"
            containerStyle={estilos.campoFila}
          />
          <Input
            label="Hasta"
            value={hasta}
            onChangeText={setHasta}
            placeholder="AAAA-MM-DD"
            autoCapitalize="none"
            containerStyle={estilos.campoFila}
          />
        </View>
        <Button title="Buscar" icon="search" onPress={buscar} loading={cargando} />
        {!cargando && (
          <AppText variante="nota" tono="suave" style={{ marginTop: SPACING.md }}>
            {total} registro{total !== 1 ? 's' : ''}
          </AppText>
        )}
      </Card>

      {cargando && items.length === 0 ? (
        <LoadingState message="Consultando..." />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => String(i.id)}
          renderItem={renderItem}
          onEndReached={cargarMas}
          onEndReachedThreshold={0.4}
          ListEmptyComponent={<EmptyState icon="document-text-outline" title="Sin registros" subtitle="No hay acciones con esos filtros" />}
          ListFooterComponent={cargandoMas ? <ActivityIndicator style={{ margin: SPACING.lg }} color={tema.colores.primarioFuerte} /> : null}
          contentContainerStyle={items.length === 0 ? estilos.emptyList : undefined}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}
