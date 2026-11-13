import { Badge, EmptyState, ListRow, LoadingState, PageHeader, Toggle } from '@/components/ds';
import { SPACING, useEstilos, type Tema } from '@/theme';
import { mensajeDeError } from '@/utils/apiError';
import { logger, showConfirm, showError } from '@/utils/logger';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, View } from 'react-native';
import { EmpresaPlataforma } from '../../../api/modelos/empresaPlataforma';
import { plataformaApi } from '../../../api/plataformaApi';

const crearEstilos = (t: Tema) => ({
  container: { flex: 1, padding: SPACING.lg, backgroundColor: t.colores.fondo },
  emptyList: { flexGrow: 1, justifyContent: 'center' as const },
  switchBox: { marginLeft: SPACING.sm },
});

export default function EmpresasPlataforma() {
  const router = useRouter();
  const estilos = useEstilos(crearEstilos);
  const [empresas, setEmpresas] = useState<EmpresaPlataforma[]>([]);
  const [loading, setLoading] = useState(false);
  const [cambiando, setCambiando] = useState<number | null>(null);

  const cargar = async () => {
    setLoading(true);
    try {
      setEmpresas((await plataformaApi.get('/Empresas')).data);
    } catch (error) {
      logger.error('Error al cargar empresas:', error);
      showError(mensajeDeError(error, 'No se pudieron cargar las empresas'));
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [])
  );

  const cambiarEstado = async (empresa: EmpresaPlataforma, activa: boolean) => {
    if (!activa) {
      const ok = await showConfirm(
        `¿Desactivar ${empresa.nombre}? Nadie de esa empresa podrá ingresar ni seguir usando la aplicación.`,
        'Desactivar empresa'
      );
      if (!ok) return;
    }
    setCambiando(empresa.id);
    try {
      await plataformaApi.patch(`/Empresas/${empresa.id}/Estado`, null, { params: { activa } });
      setEmpresas((prev) => prev.map((e) => (e.id === empresa.id ? { ...e, activa } : e)));
    } catch (error) {
      showError(mensajeDeError(error, 'No se pudo cambiar el estado de la empresa'));
    } finally {
      setCambiando(null);
    }
  };

  const renderItem = ({ item }: { item: EmpresaPlataforma }) => (
    <ListRow
      title={item.nombre ?? `Empresa ${item.id}`}
      subtitle={`${item.totalPersonas} personas · ${item.accesosActivos}/${item.totalAccesos} accesos activos`}
      icon="business-outline"
      badge={<Badge label={item.activa ? 'Activa' : 'Inactiva'} tone={item.activa ? 'success' : 'neutral'} size="sm" />}
      trailing={
        <View style={estilos.switchBox}>
          <Toggle
            value={item.activa}
            disabled={cambiando === item.id}
            onValueChange={(valor) => cambiarEstado(item, valor)}
            accessibilityLabel={`Empresa ${item.nombre ?? item.id} activa`}
          />
        </View>
      }
      chevron
      onPress={() => router.push({ pathname: '/plataforma/empresas/[id]', params: { id: String(item.id) } })}
    />
  );

  const activas = empresas.filter((e) => e.activa).length;

  return (
    <View style={estilos.container}>
      {!loading && empresas.length > 0 && (
        <PageHeader
          title={`${empresas.length} empresa${empresas.length !== 1 ? 's' : ''}`}
          subtitle={`${activas} activa${activas !== 1 ? 's' : ''}`}
          action={{ icon: 'add', onPress: () => router.push('/plataforma/empresas/crear'), label: 'Crear empresa' }}
        />
      )}

      {loading ? (
        <LoadingState message="Cargando empresas..." />
      ) : (
        <FlatList
          data={empresas}
          keyExtractor={(e) => String(e.id)}
          renderItem={renderItem}
          ListEmptyComponent={
            <EmptyState
              icon="business-outline"
              title="No hay empresas"
              subtitle="Crea la primera empresa y su administrador"
              actionLabel="Crear empresa"
              onAction={() => router.push('/plataforma/empresas/crear')}
            />
          }
          contentContainerStyle={empresas.length === 0 ? estilos.emptyList : undefined}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}
