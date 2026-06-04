import FormField from '@/components/FormField';
import LoadingView from '@/components/LoadingView';
import PrimaryButton from '@/components/PrimaryButton';
import { SPACING, commonStyles } from '@/constants/theme';
import { logger, showConfirm, showError, showSuccess } from '@/utils/logger';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { MaskedTextInput } from 'react-native-mask-text';
import { citasApi } from '../../api/citasApi';
import { ServicioCita } from '../../api/modelos/citas';

export default function EditarServicioCita() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const idServicio = Number(id);

  const [nombreServicio, setNombreServicio] = useState('');
  const [valor, setValor] = useState('');
  const [tiempoEstimado, setTiempoEstimado] = useState('');
  const [cargando, setCargando] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const cargar = async () => {
      try {
        // El backend no expone GET /Servicios/{id}; lo buscamos en la lista.
        const { data } = await citasApi.get<ServicioCita[]>('/Servicios');
        const servicio = data.find((s) => s.idServicio === idServicio);
        if (servicio) {
          setNombreServicio(servicio.nombreServicio);
          setValor(String(servicio.valor));
          setTiempoEstimado(String(servicio.tiempoEstimado));
        } else {
          showError('Servicio no encontrado');
          router.back();
        }
      } catch (error) {
        logger.error('[Citas] Error al cargar servicio:', error);
        showError('No se pudo cargar el servicio');
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, [idServicio]);

  const guardar = async () => {
    if (!nombreServicio.trim() || !valor || !tiempoEstimado) {
      showError('Nombre, valor y tiempo estimado son requeridos', 'Campos obligatorios');
      return;
    }
    setLoading(true);
    try {
      await citasApi.put(`/Servicios/${idServicio}`, {
        nombreServicio: nombreServicio.trim(),
        valor: parseFloat(valor),
        tiempoEstimado: parseInt(tiempoEstimado, 10),
      });
      showSuccess('Servicio actualizado');
      router.back();
    } catch (error) {
      logger.error('[Citas] Error al actualizar servicio:', error);
      showError('No se pudo actualizar el servicio');
    } finally {
      setLoading(false);
    }
  };

  const eliminar = async () => {
    const ok = await showConfirm('¿Eliminar este servicio?', 'Confirmar');
    if (!ok) return;
    setLoading(true);
    try {
      await citasApi.delete(`/Servicios/${idServicio}`);
      showSuccess('Servicio eliminado');
      router.back();
    } catch (error) {
      logger.error('[Citas] Error al eliminar servicio:', error);
      showError('No se pudo eliminar el servicio');
    } finally {
      setLoading(false);
    }
  };

  if (cargando) return <LoadingView message="Cargando servicio..." />;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <FormField label="Nombre del servicio">
        <TextInput value={nombreServicio} onChangeText={setNombreServicio} style={commonStyles.input} />
      </FormField>

      <FormField label="Valor">
        <MaskedTextInput
          type="currency"
          options={{ prefix: '$', decimalSeparator: ',', groupSeparator: '.', precision: 0 }}
          value={valor}
          onChangeText={(_, unmasked) => setValor(unmasked)}
          style={commonStyles.input}
          keyboardType="numeric"
        />
      </FormField>

      <FormField label="Tiempo estimado (minutos)">
        <TextInput
          value={tiempoEstimado}
          onChangeText={(t) => setTiempoEstimado(t.replace(/[^0-9]/g, ''))}
          style={commonStyles.input}
          keyboardType="numeric"
        />
      </FormField>

      <PrimaryButton title="Guardar cambios" onPress={guardar} loading={loading} />
      <View style={{ height: SPACING.md }} />
      <PrimaryButton title="Eliminar" onPress={eliminar} loading={loading} variant="danger" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { ...commonStyles.scrollContainer },
});
