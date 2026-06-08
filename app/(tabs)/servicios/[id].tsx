import FormField from '@/components/FormField';
import LoadingView from '@/components/LoadingView';
import PrimaryButton from '@/components/PrimaryButton';
import { COLORS, FONT_SIZE, FONT_WEIGHT, RADIUS, SHADOWS, SPACING, commonStyles } from '@/constants/theme';
import { logger, showConfirm, showError, showSuccess } from '@/utils/logger';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { MaskedTextInput } from 'react-native-mask-text';
import { servicioService } from '../../api/services';

export default function ServicioDetalle() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [precio, setPrecio] = useState('');
  const [disponible, setDisponible] = useState(false);
  const [errores, setErrores] = useState<{ [key in CampoValidable]?: string }>({});
  const [loading, setLoading] = useState(true);

  const validaciones = {
    nombre: { regex: /^.{3,50}$/, mensaje: 'Nombre requerido (3-50 caracteres)' },
    precio: { regex: /^\d+$/, mensaje: 'Precio inválido (solo números)' },
  };

  type CampoValidable = keyof typeof validaciones;

  useEffect(() => {
    if (id) {
      servicioService.obtenerPorId(Number(id))
        .then(res => {
          const data = res.data;
          setNombre(data.nombre);
          setDescripcion(data.descripcion);
          setPrecio(data.precio.toString());
          setDisponible(data.disponible);
        })
        .catch(err => {
          logger.error('Error al cargar servicio:', err);
          showError('No se pudo cargar el servicio');
        })
        .finally(() => setLoading(false));
    }
  }, [id]);

  const handleChange = (campo: CampoValidable, valor: string) => {
    if (campo === 'nombre') setNombre(valor);
    if (campo === 'precio') setPrecio(valor);

    const { regex, mensaje } = validaciones[campo];
    setErrores(prev => ({
      ...prev,
      [campo]: regex.test(valor) ? '' : mensaje,
    }));
  };

  const actualizar = async () => {
    const nuevosErrores: Partial<Record<CampoValidable, string>> = {};
    (Object.keys(validaciones) as CampoValidable[]).forEach((campo) => {
      const valor = { nombre, precio }[campo];
      const { regex, mensaje } = validaciones[campo];
      if (!regex.test(valor)) {
        nuevosErrores[campo] = mensaje;
      }
    });

    if (Object.keys(nuevosErrores).length > 0) {
      setErrores(nuevosErrores);
      showError('Revisa los campos con errores', 'Error de validación');
      return;
    }

    try {
      await servicioService.actualizar(Number(id), {
        id: Number(id),
        nombre,
        descripcion,
        precio: parseInt(precio),
        disponible,
        fechaCreacion: new Date().toISOString(),
      });

      showSuccess('Servicio actualizado');
      router.back();
    } catch (error) {
      logger.error('Error al actualizar:', error);
      showError('No se pudo actualizar el servicio');
    }
  };

const eliminar = async () => {
  const confirmar = await showConfirm('¿Eliminar este servicio?');

  if (!confirmar) return;

  try {
    logger.log("Eliminando servicio con id:", id);
    await servicioService.eliminar(Number(id));
    
    showSuccess("Servicio eliminado correctamente");
    router.back();
  } catch (error) {
    logger.error("Error al eliminar:", error);
    showError("No se pudo eliminar el servicio");
  }
};

  if (loading) {
    return <LoadingView message="Cargando servicio..." />;
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.formCard}>
        {/* Header del servicio */}
        <View style={styles.serviceHeader}>
          <View style={styles.serviceIconContainer}>
            <FontAwesome5 name="concierge-bell" size={24} color={COLORS.secondary} />
          </View>
          <View style={styles.serviceInfo}>
            <Text style={styles.serviceTitle}>{nombre || 'Nuevo Servicio'}</Text>
            <View style={[styles.statusBadge, disponible ? styles.statusActive : styles.statusInactive]}>
              <Text style={[styles.statusText, disponible ? styles.statusTextActive : styles.statusTextInactive]}>
                {disponible ? 'Disponible' : 'No disponible'}
              </Text>
            </View>
          </View>
        </View>

        {/* Nombre */}
        <FormField label="Nombre" error={errores.nombre}>
          <TextInput
            value={nombre}
            onChangeText={(text) => handleChange('nombre', text)}
            style={[commonStyles.input, errores.nombre && styles.inputError]}
            placeholder="Nombre del servicio"
            placeholderTextColor={COLORS.textTertiary}
          />
        </FormField>

        {/* Descripción */}
        <FormField label="Descripción">
          <TextInput
            value={descripcion}
            onChangeText={setDescripcion}
            style={[commonStyles.input, styles.textArea]}
            placeholder="Descripción detallada (opcional)"
            placeholderTextColor={COLORS.textTertiary}
            multiline
            numberOfLines={3}
          />
        </FormField>

        {/* Precio */}
        <FormField label="Precio" error={errores.precio}>
          <MaskedTextInput
            type="currency"
            options={{
              prefix: '$',
              decimalSeparator: ',',
              groupSeparator: '.',
              precision: 0,
            }}
            value={precio}
            onChangeText={(_, unmasked) => handleChange('precio', unmasked)}
            style={[commonStyles.input, errores.precio && styles.inputError]}
            keyboardType="numeric"
            placeholder="Precio en pesos"
            placeholderTextColor={COLORS.textTertiary}
          />
        </FormField>

        {/* Disponible */}
        <View style={styles.switchRow}>
          <View>
            <Text style={styles.switchLabel}>Estado del servicio</Text>
            <Text style={styles.switchHint}>{disponible ? 'Visible para clientes' : 'Oculto temporalmente'}</Text>
          </View>
          <Switch 
            value={disponible} 
            onValueChange={setDisponible}
            trackColor={{ false: COLORS.border, true: COLORS.primaryLight }}
            thumbColor={disponible ? COLORS.primary : COLORS.textTertiary}
          />
        </View>
      </View>

      {/* Botones de acción */}
      <View style={styles.actionsContainer}>
        <PrimaryButton title="Guardar cambios" onPress={actualizar}/>
        
        <Pressable
          style={({ pressed }) => [
            styles.deleteButton,
            pressed && styles.deleteButtonPressed,
          ]}
          onPress={eliminar}
        >
          <FontAwesome5 name="trash-alt" size={16} color={COLORS.error} />
          <Text style={styles.deleteButtonText}>Eliminar servicio</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { 
    padding: SPACING.lg, 
    backgroundColor: COLORS.background,
    flexGrow: 1,
  },
  formCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.md,
  },
  serviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xl,
    paddingBottom: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  serviceIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.secondarySurface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
  },
  statusActive: {
    backgroundColor: COLORS.successLight,
  },
  statusInactive: {
    backgroundColor: COLORS.surface,
  },
  statusText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.semibold,
  },
  statusTextActive: {
    color: COLORS.success,
  },
  statusTextInactive: {
    color: COLORS.textSecondary,
  },
  inputError: { 
    borderColor: COLORS.error,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
  },
  switchLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
    color: COLORS.text,
  },
  switchHint: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  actionsContainer: {
    marginTop: SPACING.lg,
    gap: SPACING.md,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.error,
    backgroundColor: COLORS.white,
  },
  deleteButtonPressed: {
    backgroundColor: COLORS.errorLight,
  },
  deleteButtonText: {
    color: COLORS.error,
    fontWeight: FONT_WEIGHT.semibold,
    fontSize: FONT_SIZE.md,
  },
});
