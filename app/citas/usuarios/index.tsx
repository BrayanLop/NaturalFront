import EmptyState from '@/components/EmptyState';
import ListCard from '@/components/ListCard';
import LoadingView from '@/components/LoadingView';
import PrimaryButton from '@/components/PrimaryButton';
import { COLORS, FONT_SIZE, FONT_WEIGHT, RADIUS, SPACING, commonStyles } from '@/constants/theme';
import { logger, showConfirm, showError, showSuccess } from '@/utils/logger';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { citasApi } from '../../api/citasApi';
import { UsuarioCita } from '../../api/modelos/citas';

export default function UsuariosCitas() {
  const [usuarios, setUsuarios] = useState<UsuarioCita[]>([]);
  const [loading, setLoading] = useState(false);
  const [nombre, setNombre] = useState('');
  const [guardando, setGuardando] = useState(false);

  const cargar = async () => {
    setLoading(true);
    try {
      const { data } = await citasApi.get<UsuarioCita[]>('/Usuarios');
      setUsuarios(data);
    } catch (error) {
      logger.error('[Citas] Error al cargar usuarios:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [])
  );

  const crear = async () => {
    if (!nombre.trim()) {
      showError('Escribe un nombre', 'Nombre requerido');
      return;
    }
    setGuardando(true);
    try {
      await citasApi.post('/Usuarios', { nombreUsuario: nombre.trim() });
      setNombre('');
      showSuccess('Usuario creado');
      cargar();
    } catch (error) {
      logger.error('[Citas] Error al crear usuario:', error);
      showError('No se pudo crear el usuario');
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = async (item: UsuarioCita) => {
    const ok = await showConfirm(`¿Eliminar a "${item.nombreUsuario}"?`, 'Confirmar');
    if (!ok) return;
    try {
      await citasApi.delete(`/Usuarios/${item.id}`);
      showSuccess('Usuario eliminado');
      cargar();
    } catch (error) {
      logger.error('[Citas] Error al eliminar usuario:', error);
      showError('No se pudo eliminar el usuario');
    }
  };

  const renderItem = useCallback(
    ({ item }: { item: UsuarioCita }) => (
      <ListCard
        title={item.nombreUsuario}
        subtitle={`ID: ${item.id}`}
        leftIcon={<FontAwesome5 name="user" size={18} color={COLORS.secondary} />}
        rightContent={
          <Pressable hitSlop={8} onPress={() => eliminar(item)} style={styles.deleteButton}>
            <FontAwesome5 name="trash-alt" size={16} color={COLORS.error} />
          </Pressable>
        }
      />
    ),
    []
  );

  return (
    <View style={styles.container}>
      <View style={styles.formRow}>
        <TextInput
          style={[commonStyles.input, styles.input]}
          placeholder="Nombre del cliente / empleado"
          value={nombre}
          onChangeText={setNombre}
          placeholderTextColor={COLORS.textTertiary}
        />
        <View style={styles.addButtonWrapper}>
          <PrimaryButton title="Agregar" onPress={crear} loading={guardando} fullWidth={false} size="small" />
        </View>
      </View>

      {loading ? (
        <LoadingView message="Cargando usuarios..." />
      ) : (
        <FlatList
          data={usuarios}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          ListHeaderComponent={
            usuarios.length > 0 ? (
              <Text style={styles.listHeader}>
                {usuarios.length} usuario{usuarios.length !== 1 ? 's' : ''}
              </Text>
            ) : null
          }
          ListEmptyComponent={
            <EmptyState
              message="No hay usuarios"
              icon="👥"
              subtitle="Agrega clientes o empleados con el formulario de arriba"
            />
          }
          contentContainerStyle={usuarios.length === 0 ? styles.emptyList : undefined}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: SPACING.lg, backgroundColor: COLORS.background },
  formRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  input: { flex: 1 },
  addButtonWrapper: { borderRadius: RADIUS.md, overflow: 'hidden' },
  listHeader: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHT.medium,
    marginBottom: SPACING.md,
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.errorLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyList: { flex: 1, justifyContent: 'center' },
});
