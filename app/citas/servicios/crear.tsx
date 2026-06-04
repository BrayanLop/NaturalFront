import FormField from '@/components/FormField';
import PrimaryButton from '@/components/PrimaryButton';
import { commonStyles } from '@/constants/theme';
import { logger, showError, showSuccess } from '@/utils/logger';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, TextInput } from 'react-native';
import { MaskedTextInput } from 'react-native-mask-text';
import { citasApi } from '../../api/citasApi';

export default function CrearServicioCita() {
  const router = useRouter();

  const [nombreServicio, setNombreServicio] = useState('');
  const [valor, setValor] = useState('');
  const [tiempoEstimado, setTiempoEstimado] = useState('');
  const [loading, setLoading] = useState(false);

  const guardar = async () => {
    if (!nombreServicio.trim() || !valor || !tiempoEstimado) {
      showError('Nombre, valor y tiempo estimado son requeridos', 'Campos obligatorios');
      return;
    }

    setLoading(true);
    try {
      await citasApi.post('/Servicios', {
        nombreServicio: nombreServicio.trim(),
        valor: parseFloat(valor),
        tiempoEstimado: parseInt(tiempoEstimado, 10),
      });
      showSuccess('Servicio creado correctamente');
      router.back();
    } catch (error) {
      logger.error('[Citas] Error al crear servicio:', error);
      showError('No se pudo crear el servicio');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <FormField label="Nombre del servicio">
        <TextInput
          value={nombreServicio}
          onChangeText={setNombreServicio}
          style={commonStyles.input}
          placeholder="Ej: Corte de cabello"
        />
      </FormField>

      <FormField label="Valor">
        <MaskedTextInput
          type="currency"
          options={{ prefix: '$', decimalSeparator: ',', groupSeparator: '.', precision: 0 }}
          value={valor}
          onChangeText={(_, unmasked) => setValor(unmasked)}
          style={commonStyles.input}
          keyboardType="numeric"
          placeholder="Ej: $20.000"
        />
      </FormField>

      <FormField label="Tiempo estimado (minutos)">
        <TextInput
          value={tiempoEstimado}
          onChangeText={(t) => setTiempoEstimado(t.replace(/[^0-9]/g, ''))}
          style={commonStyles.input}
          keyboardType="numeric"
          placeholder="Ej: 30"
        />
      </FormField>

      <PrimaryButton title="Guardar" onPress={guardar} loading={loading} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { ...commonStyles.scrollContainer },
});
