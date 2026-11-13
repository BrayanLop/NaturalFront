import { AppText, Badge, Button, ConfirmDialog, Icon, Input, LoadingState, ToggleRow } from '@/components/ds';
import CampoPrecio from '@/components/servicios/CampoPrecio';
import { SPACING, useEstilos, useTheme, type Tema } from '@/theme';
import { logger } from '@/utils/logger';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Platform, ScrollView, View } from 'react-native';
import { api } from '../../api/api';

const crearEstilos = (t: Tema) => ({
  contenedor: { padding: SPACING.lg, backgroundColor: t.colores.fondo, flexGrow: 1 },
  cabecera: { flexDirection: 'row' as const, alignItems: 'center' as const, marginBottom: SPACING.xl },
  icono: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: t.colores.primarioSuave,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: SPACING.md,
  },
  cabeceraTextos: { flex: 1, minWidth: 0 },
  badge: { alignSelf: 'flex-start' as const, marginTop: SPACING.xs },
  acciones: { gap: SPACING.md, marginTop: SPACING.sm },
});

export default function ServicioDetalle() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const estilos = useEstilos(crearEstilos);
  const { tema } = useTheme();

  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [precio, setPrecio] = useState('');
  const [disponible, setDisponible] = useState(false);
  const [errores, setErrores] = useState<{ [key in CampoValidable]?: string }>({});
  const [loading, setLoading] = useState(true);
  const [confirmarEliminar, setConfirmarEliminar] = useState(false);

  const validaciones = {
    nombre: { regex: /^.{3,50}$/, mensaje: 'Nombre requerido (3-50 caracteres)' },
    precio: { regex: /^\d+$/, mensaje: 'Precio inválido (solo números)' },
  };

  type CampoValidable = keyof typeof validaciones;

  useEffect(() => {
    if (id) {
      api.get(`/Servicio/Obtener/${id}`)
        .then(res => {
          const data = res.data;
          setNombre(data.nombre);
          setDescripcion(data.descripcion);
          setPrecio(data.precio.toString());
          setDisponible(data.disponible);
        })
        .catch(err => {
          logger.error('Error al cargar servicio:', err);
          Alert.alert('Error', 'No se pudo cargar el servicio');
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
      Alert.alert('Error', 'Revisa los campos con errores');
      return;
    }

    try {
      await api.put(`/Servicio/Actualizar/${id}`, {
        id: Number(id),
        nombre,
        descripcion,
        precio: parseInt(precio),
        disponible,
        fechaCreacion: new Date().toISOString(),
      });

      Alert.alert('Éxito', 'Servicio actualizado');
      router.back();
    } catch (error) {
      logger.error('Error al actualizar:', error);
      Alert.alert('Error', 'No se pudo actualizar el servicio');
    }
  };

  const eliminar = async () => {
    setConfirmarEliminar(false);
    try {
      logger.log('Eliminando servicio con id:', id);
      await api.delete(`/Servicio/Eliminar/${id}`);

      if (Platform.OS === 'web') {
        window.alert('Servicio eliminado correctamente');
      } else {
        Alert.alert('Eliminado', 'Servicio eliminado correctamente');
      }

      router.back();
    } catch (error) {
      logger.error('Error al eliminar:', error);

      if (Platform.OS === 'web') {
        window.alert('No se pudo eliminar el servicio');
      } else {
        Alert.alert('Error', 'No se pudo eliminar el servicio');
      }
    }
  };

  if (loading) {
    return <LoadingState message="Cargando servicio..." />;
  }

  return (
    <ScrollView contentContainerStyle={estilos.contenedor} keyboardShouldPersistTaps="handled">
      <View style={estilos.cabecera}>
        <View style={estilos.icono}>
          <Icon name="briefcase-outline" size={26} color={tema.colores.primarioTexto} />
        </View>
        <View style={estilos.cabeceraTextos}>
          <AppText variante="subtitulo" numberOfLines={2}>
            {nombre || 'Nuevo servicio'}
          </AppText>
          <View style={estilos.badge}>
            <Badge
              label={disponible ? 'Disponible' : 'No disponible'}
              tone={disponible ? 'success' : 'neutral'}
              size="sm"
            />
          </View>
        </View>
      </View>

      <Input
        label="Nombre"
        value={nombre}
        onChangeText={(text) => handleChange('nombre', text)}
        error={errores.nombre || undefined}
        placeholder="Nombre del servicio"
      />
      <Input
        label="Descripción"
        value={descripcion}
        onChangeText={setDescripcion}
        placeholder="Descripción detallada (opcional)"
        multiline
      />
      <CampoPrecio
        label="Precio"
        value={precio}
        onChangeText={(v) => handleChange('precio', v)}
        error={errores.precio || undefined}
        placeholder="Precio en pesos"
      />
      <ToggleRow
        label="Estado del servicio"
        description={disponible ? 'Visible al registrar' : 'Oculto temporalmente'}
        value={disponible}
        onValueChange={setDisponible}
      />

      <View style={estilos.acciones}>
        <Button title="Guardar cambios" onPress={actualizar} />
        <Button title="Eliminar servicio" variant="danger" icon="trash-outline" onPress={() => setConfirmarEliminar(true)} />
      </View>

      <ConfirmDialog
        visible={confirmarEliminar}
        title="¿Eliminar este servicio?"
        message="Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        destructive
        onConfirm={eliminar}
        onCancel={() => setConfirmarEliminar(false)}
      />
    </ScrollView>
  );
}
