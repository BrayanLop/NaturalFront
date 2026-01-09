import FormField from '@/components/FormField';
import PrimaryButton from '@/components/PrimaryButton';
import { commonStyles } from '@/constants/theme';
import { logger, showError, showSuccess } from '@/utils/logger';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    View
} from 'react-native';
import { MaskedTextInput } from 'react-native-mask-text';
import { api } from '../../api/api';

export default function CrearServicio() {
  const router = useRouter();

  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [precio, setPrecio] = useState('');
  const [disponible, setDisponible] = useState(true);
  const [loading, setLoading] = useState(false);

  const guardar = async () => {
    if (!nombre || !precio) {
      showError('Nombre y precio son requeridos', 'Campos obligatorios');
      return;
    }

    setLoading(true);
    try {
      await api.post('/Servicio/Crear', {
        nombre,
        descripcion,
        precio: parseInt(precio),
        disponible,
        fechaCreacion: new Date().toISOString(),
      });

      showSuccess('Servicio creado correctamente');
      router.back();
    } catch (error) {
      logger.error('Error al crear servicio:', error);
      showError('No se pudo crear el servicio');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <FormField label="Nombre">
        <TextInput
          value={nombre}
          onChangeText={setNombre}
          style={commonStyles.input}
          placeholder="Nombre del servicio"
        />
      </FormField>

      <FormField label="Descripción">
        <TextInput
          value={descripcion}
          onChangeText={setDescripcion}
          style={commonStyles.input}
          placeholder="Descripción opcional"
        />
      </FormField>

      <FormField label="Precio">
        <MaskedTextInput
          type="currency"
          options={{
            prefix: '$',
            decimalSeparator: ',',
            groupSeparator: '.',
            precision: 0,
          }}
          value={precio}
          onChangeText={(_, unmasked) => setPrecio(unmasked)}
          style={commonStyles.input}
          keyboardType="numeric"
          placeholder="Ej: $15.000"
        />
      </FormField>

      <View style={styles.switchRow}>
        <Text style={commonStyles.label}>Disponible</Text>
        <Switch value={disponible} onValueChange={setDisponible} />
      </View>

      <PrimaryButton
        title="Guardar"
        onPress={guardar}
        loading={loading}
        variant="blue"
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    ...commonStyles.scrollContainer,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
});
