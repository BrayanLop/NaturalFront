import { Button, ConfirmDialog, Input, LoadingState, Select, ToggleRow } from '@/components/ds';
import { SPACING, useEstilos, type Tema } from '@/theme';
import { logger } from '@/utils/logger';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Platform, ScrollView, View } from 'react-native';
import { api } from '../../api/api';

const crearEstilos = (t: Tema) => ({
  contenedor: { flexGrow: 1, padding: SPACING.lg, backgroundColor: t.colores.fondo },
  acciones: { gap: SPACING.md, marginTop: SPACING.sm },
});

export default function ConfiguracionDetalle() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const estilos = useEstilos(crearEstilos);

  const [configuracion, setConfiguracion] = useState({
    id: 0,
    servicioId: '',
    porcentajeTrabajador: '',
    porcentajeEmpresa: '',
    estado: true,
  });

  const [servicios, setServicios] = useState<{ id: number; nombre: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmarEliminar, setConfirmarEliminar] = useState(false);

  /* ===================== CARGA INICIAL ===================== */
  useEffect(() => {
    if (!id) return;

    Promise.all([
      api.get(`/ConfiguracionServicio/Obtener/${id}`),
      api.get('/Servicio/Obtener'),
    ])
      .then(([configRes, serviciosRes]) => {
        const data = configRes.data;
        setConfiguracion({
          id: data.id,
          servicioId: data.servicioId.toString(),
          porcentajeTrabajador: data.porcentajeTrabajador.toString(),
          porcentajeEmpresa: data.porcentajeEmpresa.toString(),
          estado: data.estado,
        });
        setServicios(serviciosRes.data);
      })
      .catch(() => {
        Alert.alert('Error', 'No se pudo cargar la información');
      })
      .finally(() => setLoading(false));
  }, [id]);

  /* ===================== HANDLERS ===================== */
  const handleChange = (campo: string, valor: string) => {
    setConfiguracion((prev) => ({ ...prev, [campo]: valor }));
  };

  const setPorcentajeEmpresa = (valor: string) => {
    const numero = parseFloat(valor);
    const empresa = isNaN(numero) ? '' : Math.min(100, Math.max(0, numero)).toString();
    const trabajador = empresa === '' ? '' : (100 - parseFloat(empresa)).toString();
    setConfiguracion((prev) => ({
      ...prev,
      porcentajeEmpresa: valor,
      porcentajeTrabajador: trabajador,
    }));
  };

  /* ===================== ACTUALIZAR ===================== */
  const actualizarConfiguracion = async () => {
    if (!id) return;

    const pt = parseFloat(configuracion.porcentajeTrabajador);
    const pe = parseFloat(configuracion.porcentajeEmpresa);

    if (!configuracion.servicioId) {
      Alert.alert('Error', 'Debe seleccionar un servicio');
      return;
    }

    if (isNaN(pt) || isNaN(pe)) {
      Alert.alert('Error', 'Los porcentajes deben ser numéricos');
      return;
    }

    if (pt + pe !== 100) {
      Alert.alert('Error', 'La suma de porcentajes debe ser 100%');
      return;
    }

    try {
      await api.put(`/ConfiguracionServicio/Actualizar/${id}`, {
        ...configuracion,
        servicioId: parseInt(configuracion.servicioId),
        porcentajeTrabajador: pt,
        porcentajeEmpresa: pe,
      });

      Alert.alert('Éxito', 'Configuración actualizada correctamente');
      router.back();
    } catch (error) {
      logger.error(error);
      Alert.alert('Error', 'No se pudo actualizar la configuración');
    }
  };

  /* ===================== ELIMINAR ===================== */
  const eliminarConfiguracion = async () => {
    setConfirmarEliminar(false);
    if (!id) {
      alert('ID no válido');
      return;
    }

    try {
      await api.delete(`/ConfiguracionServicio/Eliminar/${id}`);
      if (Platform.OS === 'web') {
        alert('Configuración eliminada');
      } else {
        Alert.alert('Eliminado', 'Configuración eliminada');
      }
      router.back();
    } catch (error) {
      logger.error(error);
      if (Platform.OS === 'web') {
        alert('No se pudo eliminar');
      } else {
        Alert.alert('Error', 'No se pudo eliminar');
      }
    }
  };

  if (loading) {
    return <LoadingState message="Cargando configuración..." />;
  }

  return (
    <ScrollView contentContainerStyle={estilos.contenedor} keyboardShouldPersistTaps="handled">
      <Select
        label="Servicio"
        placeholder="Seleccione un servicio"
        value={configuracion.servicioId || null}
        onChange={(v) => handleChange('servicioId', v)}
        options={servicios.map((s) => ({ value: s.id.toString(), label: s.nombre }))}
      />

      <Input
        label="Porcentaje empresa"
        value={configuracion.porcentajeEmpresa}
        onChangeText={setPorcentajeEmpresa}
        keyboardType="numeric"
        leftIcon="pie-chart-outline"
        placeholder="Ej. 60"
      />

      <Input
        label="Porcentaje trabajador"
        value={configuracion.porcentajeTrabajador}
        editable={false}
        keyboardType="numeric"
        helper="Se calcula automáticamente"
      />

      <ToggleRow
        label="Estado de la configuración"
        description={configuracion.estado ? 'Activa' : 'Inactiva'}
        value={configuracion.estado}
        onValueChange={(value) => setConfiguracion((prev) => ({ ...prev, estado: value }))}
      />

      <View style={estilos.acciones}>
        <Button title="Actualizar" onPress={actualizarConfiguracion} />
        <Button title="Eliminar" variant="danger" icon="trash-outline" onPress={() => setConfirmarEliminar(true)} />
      </View>

      <ConfirmDialog
        visible={confirmarEliminar}
        title="¿Eliminar esta configuración?"
        message="Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        destructive
        onConfirm={eliminarConfiguracion}
        onCancel={() => setConfirmarEliminar(false)}
      />
    </ScrollView>
  );
}
