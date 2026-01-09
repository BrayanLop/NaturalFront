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
    TouchableOpacity,
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

  const guardar = async () => {
    if (!nombre || !precio) {
      showError('Nombre y precio son requeridos', 'Campos obligatorios');
      return;
    }

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
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>

      {/* Nombre */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Nombre</Text>
        <TextInput
          value={nombre}
          onChangeText={setNombre}
          style={styles.input}
          placeholder="Nombre del servicio"
        />
      </View>

      {/* Descripción */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Descripción</Text>
        <TextInput
          value={descripcion}
          onChangeText={setDescripcion}
          style={styles.input}
          placeholder="Descripción opcional"
        />
      </View>

      {/* Precio */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Precio</Text>
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
          style={styles.input}
          keyboardType="numeric"
          placeholder="Ej: $15.000"
        />
      </View>

      {/* Disponible */}
      <View style={styles.switchRow}>
        <Text style={styles.label}>Disponible</Text>
        <Switch value={disponible} onValueChange={setDisponible} />
      </View>

      {/* Guardar */}
      <TouchableOpacity style={styles.button} onPress={guardar}>
        <Text style={styles.buttonText}>Guardar</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    ...commonStyles.scrollContainer,
  },
  fieldContainer: {
    ...commonStyles.fieldContainer,
  },
  label: {
    ...commonStyles.label,
  },
  input: {
    ...commonStyles.input,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  button: {
    ...commonStyles.button,
  },
  buttonText: {
    ...commonStyles.buttonText,
  },
});
