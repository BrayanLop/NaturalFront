import EmptyState from '@/components/EmptyState';
import ListCard from '@/components/ListCard';
import LoadingView from '@/components/LoadingView';
import StatusBadge from '@/components/StatusBadge';
import { COLORS, FONT_SIZE, FONT_WEIGHT, SHADOWS, SPACING } from '@/constants/theme';
import { mensajeDeError } from '@/utils/apiError';
import { logger, showError } from '@/utils/logger';
import { getRoleName } from '@/utils/roles';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { ClienteAccesos } from '../../app/api/accesosClient';
import { Acceso } from '../../app/api/modelos/acceso';

interface Props {
  cliente: ClienteAccesos;
  /** Abre la pantalla de creación (con la persona preseleccionada si viene). */
  onCrear: (personaId?: number) => void;
  /** Abre el detalle de un acceso existente. */
  onAbrirDetalle: (acceso: Acceso) => void;
}

/** Lista de personas y su acceso, con interruptor activo/inactivo. La usan el rol 01 y el superadmin. */
export default function ListaAccesos({ cliente, onCrear, onAbrirDetalle }: Props) {
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
    <ListCard
      title={`${item.nombre} ${item.apellido}`}
      subtitle={item.tieneAcceso ? `Usuario: ${item.nombreUsuario}` : 'Sin acceso a la aplicación'}
      badges={
        item.tieneAcceso ? (
          <StatusBadge label={getRoleName(item.rol ?? '')} type="info" />
        ) : (
          <StatusBadge label="Sin acceso" type="pendiente" />
        )
      }
      onPress={() => abrir(item)}
      leftIcon={
        <FontAwesome5
          name={item.tieneAcceso ? 'user-check' : 'user-slash'}
          size={18}
          color={item.tieneAcceso && item.activo ? COLORS.primary : COLORS.textTertiary}
        />
      }
      rightContent={
        item.tieneAcceso ? (
          <View style={styles.switchBox}>
            <Text style={styles.switchLabel}>{item.activo ? 'Activo' : 'Inactivo'}</Text>
            <Switch
              value={item.activo}
              disabled={cambiando === item.usuarioId}
              onValueChange={(valor) => cambiarEstado(item, valor)}
              trackColor={{ false: COLORS.border, true: COLORS.primary }}
            />
          </View>
        ) : undefined
      }
    />
  );

  const conAcceso = accesos.filter((a) => a.tieneAcceso).length;

  return (
    <View style={styles.container}>
      {!loading && accesos.length > 0 && (
        <View style={styles.header}>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>Accesos</Text>
            <Text style={styles.headerSubtitle}>
              {conAcceso} de {accesos.length} personas con acceso
            </Text>
          </View>
          <Pressable
            style={({ pressed }) => [styles.addButton, pressed && styles.addButtonPressed]}
            onPress={() => onCrear()}
          >
            <FontAwesome5 name="plus" size={14} color={COLORS.white} />
          </Pressable>
        </View>
      )}

      {loading ? (
        <LoadingView message="Cargando accesos..." />
      ) : (
        <FlatList
          data={accesos}
          keyExtractor={(item) => `${item.personaId}-${item.usuarioId ?? 'sin'}`}
          renderItem={renderItem}
          ListEmptyComponent={
            <EmptyState
              message="No hay personas registradas"
              icon="👥"
              subtitle="Crea primero una persona en el módulo Personas"
            />
          }
          contentContainerStyle={accesos.length === 0 ? styles.emptyList : undefined}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: SPACING.lg, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerInfo: { flex: 1 },
  headerTitle: { fontSize: FONT_SIZE.xl, fontWeight: FONT_WEIGHT.bold, color: COLORS.text },
  headerSubtitle: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, marginTop: SPACING.xs },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.primary,
  },
  addButtonPressed: { backgroundColor: COLORS.primaryDark, transform: [{ scale: 0.95 }] },
  emptyList: { flex: 1, justifyContent: 'center' },
  switchBox: { alignItems: 'center', marginLeft: SPACING.sm },
  switchLabel: { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary },
});
