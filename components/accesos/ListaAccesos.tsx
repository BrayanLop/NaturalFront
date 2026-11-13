import { AppText, Badge, EmptyState, ListRow, LoadingState, PageHeader, Toggle } from '@/components/ds';
import { SPACING, useEstilos, type Tema } from '@/theme';
import { mensajeDeError } from '@/utils/apiError';
import { logger, showError } from '@/utils/logger';
import { getRoleName } from '@/utils/roles';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { FlatList, View } from 'react-native';
import { ClienteAccesos } from '../../app/api/accesosClient';
import { Acceso } from '../../app/api/modelos/acceso';

interface Props {
  cliente: ClienteAccesos;
  /** Abre la pantalla de creación (con la persona preseleccionada si viene). */
  onCrear: (personaId?: number) => void;
  /** Abre el detalle de un acceso existente. */
  onAbrirDetalle: (acceso: Acceso) => void;
}

const crearEstilos = (t: Tema) => ({
  contenedor: { flex: 1, padding: SPACING.lg, backgroundColor: t.colores.fondo },
  listaVacia: { flexGrow: 1, justifyContent: 'center' as const },
  interruptor: { alignItems: 'center' as const, marginLeft: SPACING.sm },
});

/** Lista de personas y su acceso, con interruptor activo/inactivo. La usan el rol 01 y el superadmin. */
export default function ListaAccesos({ cliente, onCrear, onAbrirDetalle }: Props) {
  const estilos = useEstilos(crearEstilos);
  const [accesos, setAccesos] = useState<Acceso[]>([]);
  const [loading, setLoading] = useState(false);
  const [cambiando, setCambiando] = useState<number | null>(null);

  const cargar = async () => {
    setLoading(true);
    try {
      setAccesos(await cliente.listar());
    } catch (error) {
      logger.error('Error al cargar accesos:', error);
      showError(mensajeDeError(error, 'No se pudieron cargar los accesos'));
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cliente])
  );

  const cambiarEstado = async (item: Acceso, activo: boolean) => {
    if (!item.usuarioId) return;
    setCambiando(item.usuarioId);
    try {
      await cliente.cambiarEstado(item.usuarioId, activo);
      setAccesos((prev) => prev.map((a) => (a.usuarioId === item.usuarioId ? { ...a, activo } : a)));
    } catch (error) {
      showError(mensajeDeError(error, 'No se pudo cambiar el estado del acceso'));
    } finally {
      setCambiando(null);
    }
  };

  const abrir = (item: Acceso) => (item.tieneAcceso ? onAbrirDetalle(item) : onCrear(item.personaId));

  const renderItem = ({ item }: { item: Acceso }) => (
    <ListRow
      title={`${item.nombre} ${item.apellido}`}
      subtitle={item.tieneAcceso ? `Usuario: ${item.nombreUsuario}` : 'Sin acceso a la aplicación'}
      icon={item.tieneAcceso ? 'key-outline' : 'person-outline'}
      badge={
        item.tieneAcceso ? (
          <Badge label={getRoleName(item.rol ?? '')} tone="info" size="sm" />
        ) : (
          <Badge label="Sin acceso" tone="neutral" size="sm" />
        )
      }
      trailing={
        item.tieneAcceso ? (
          <View style={estilos.interruptor}>
            <AppText variante="nota" tono="suave">
              {item.activo ? 'Activo' : 'Inactivo'}
            </AppText>
            <Toggle
              value={item.activo}
              disabled={cambiando === item.usuarioId}
              onValueChange={(valor) => cambiarEstado(item, valor)}
              accessibilityLabel={`Acceso activo de ${item.nombre} ${item.apellido}`}
            />
          </View>
        ) : undefined
      }
      chevron
      onPress={() => abrir(item)}
    />
  );

  const conAcceso = accesos.filter((a) => a.tieneAcceso).length;

  return (
    <View style={estilos.contenedor}>
      {!loading && accesos.length > 0 && (
        <PageHeader
          title={`${accesos.length} persona${accesos.length !== 1 ? 's' : ''}`}
          subtitle={`${conAcceso} con acceso`}
          action={{ icon: 'add', onPress: () => onCrear(), label: 'Crear acceso' }}
        />
      )}

      {loading ? (
        <LoadingState message="Cargando accesos..." />
      ) : (
        <FlatList
          data={accesos}
          keyExtractor={(item) => `${item.personaId}-${item.usuarioId ?? 'sin'}`}
          renderItem={renderItem}
          ListEmptyComponent={
            <EmptyState
              icon="people-outline"
              title="No hay personas registradas"
              subtitle="Crea primero una persona en el módulo Personas"
            />
          }
          contentContainerStyle={accesos.length === 0 ? estilos.listaVacia : undefined}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}
