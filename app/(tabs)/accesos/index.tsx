import EmptyState from '@/components/EmptyState';
import ListCard from '@/components/ListCard';
import LoadingView from '@/components/LoadingView';
import StatusBadge from '@/components/StatusBadge';
import { COLORS, FONT_SIZE, FONT_WEIGHT, SHADOWS, SPACING } from '@/constants/theme';
import { useRole } from '@/hooks/useRole';
import { mensajeDeError } from '@/utils/apiError';
import { logger, showError } from '@/utils/logger';
import { getRoleName, puedeGestionarAccesos } from '@/utils/roles';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { api } from '../../api/api';
import { Acceso } from '../../api/modelos/acceso';

export default function Accesos() {
  const router = useRouter();
  const { rol } = useRole();
  const [accesos, setAccesos] = useState<Acceso[]>([]);
  const [loading, setLoading] = useState(false);
  const [cambiando, setCambiando] = useState<number | null>(null);

  const cargar = async () => {
    setLoading(true);
    try {
      const response = await api.get('Acceso/Obtener');
      setAccesos(response.data);
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
    }, [])
  );

  const cambiarEstado = async (item: Acceso, activo: boolean) => {
    if (!item.usuarioId) return;
    setCambiando(item.usuarioId);
    try {
      await api.patch(`Acceso/CambiarEstado/${item.usuarioId}`, null, { params: { activo } });
      setAccesos((prev) => prev.map((a) => (a.usuarioId === item.usuarioId ? { ...a, activo } : a)));
    } catch (error) {
      showError(mensajeDeError(error, 'No se pudo cambiar el estado del acceso'));
    } finally {
      setCambiando(null);
    }
  };

  const abrir = (item: Acceso) => {
    if (item.tieneAcceso) {
      router.push({
        pathname: '/accesos/[id]',
        params: {
          id: String(item.usuarioId),
          nombre: `${item.nombre} ${item.apellido}`,
          usuario: item.nombreUsuario ?? '',
          rol: item.rol ?? '',
        },
      });
    } else {
      router.push({ pathname: '/accesos/crear', params: { personaId: String(item.personaId) } });
    }
  };

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

  if (!puedeGestionarAccesos(rol)) {
    return (
      <View style={styles.container}>
        <EmptyState message="Sin permiso" icon="🔒" subtitle="Solo el administrador gestiona los accesos" />
      </View>
    );
  }

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
            onPress={() => router.push('/accesos/crear')}
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
