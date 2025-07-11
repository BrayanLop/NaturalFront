import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActionSheetIOS,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { api } from '../../api/api';

export default function CrearConfiguracion() {
  const router = useRouter();

  const [configuracion, setConfiguracion] = useState({
    servicioId: '',
    porcentajeTrabajador: '',
    porcentajeEmpresa: '',
    estado: true,
  });

  const [errores, setErrores] = useState<Partial<Record<keyof typeof configuracion, string>>>({});
  const [servicios, setServicios] = useState<{ id: number; nombre: string }[]>([]);

  useEffect(() => {
    api.get(`/Servicio/Obtener`)
      .then((res) => setServicios(res.data))
      .catch((err) => {
        console.error('Error cargando servicios', err);
        Alert.alert('Error', 'No se pudieron cargar los servicios');
      });
  }, []);

  const handleChange = (campo: keyof typeof configuracion, valor: string) => {
    setConfiguracion((prev) => ({ ...prev, [campo]: valor }));

    if ((campo === 'porcentajeTrabajador' || campo === 'porcentajeEmpresa') && valor !== '') {
      const num = parseFloat(valor);
      if (isNaN(num) || num < 0 || num > 100) {
        setErrores((prev) => ({ ...prev, [campo]: 'Debe ser un número entre 0 y 100' }));
      } else {
        setErrores((prev) => ({ ...prev, [campo]: '' }));
      }
    } else {
      setErrores((prev) => ({ ...prev, [campo]: '' }));
    }
  };

  const seleccionarServicio = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancelar', ...servicios.map((s) => s.nombre)],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex > 0) {
            const servicioSeleccionado = servicios[buttonIndex - 1];
            handleChange('servicioId', servicioSeleccionado.id.toString());
          }
        }
      );
    }
  };

  const guardar = async () => {
    const pt = parseFloat(configuracion.porcentajeTrabajador);
    const pe = parseFloat(configuracion.porcentajeEmpresa);
    const servicioId = parseInt(configuracion.servicioId);

    if (isNaN(servicioId)) {
      setErrores((prev) => ({ ...prev, servicioId: 'Servicio no válido' }));
      Alert.alert('Error', 'Selecciona un servicio válido');
      return;
    }

    if (isNaN(pt) || isNaN(pe)) {
      Alert.alert('Error', 'Porcentajes inválidos');
      return;
    }

    if (pt + pe !== 100) {
      Alert.alert('Error', 'La suma de los porcentajes debe ser 100%');
      return;
    }

    try {
      await api.post('ConfiguracionServicio/Crear', {
        servicioId,
        porcentajeTrabajador: pt,
        porcentajeEmpresa: pe,
        estado: configuracion.estado,
      });

      Alert.alert('Éxito', 'Configuración guardada');
      router.back();
    } catch (error) {
      console.error('Error al guardar:', error);
      Alert.alert('Error', 'No se pudo guardar la configuración');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Servicio</Text>

        {Platform.OS === 'ios' ? (
          <TouchableOpacity
            style={[styles.input, errores.servicioId && styles.inputError]}
            onPress={seleccionarServicio}
          >
            <Text style={{ color: configuracion.servicioId ? '#000' : '#888' }}>
              {
                configuracion.servicioId
                  ? servicios.find((s) => s.id === parseInt(configuracion.servicioId))?.nombre
                  : 'Selecciona un servicio'
              }
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={[styles.pickerContainer, errores.servicioId && styles.inputError]}>
            <TextInput
              placeholder="Selecciona el ID del servicio"
              value={
                configuracion.servicioId
                  ? servicios.find((s) => s.id === parseInt(configuracion.servicioId))?.nombre ?? ''
                  : ''
              }
              style={{ padding: 12 }}
              editable={false}
            />
          </View>
        )}
        {errores.servicioId ? <Text style={styles.errorText}>{errores.servicioId}</Text> : null}
      </View>

      <View style={styles.fieldContainer}>
        <Text style={styles.label}>% Trabajador</Text>
        <TextInput
          value={configuracion.porcentajeTrabajador}
          keyboardType="numeric"
          onChangeText={(text) => handleChange('porcentajeTrabajador', text)}
          style={[styles.input, errores.porcentajeTrabajador && styles.inputError]}
        />
        {errores.porcentajeTrabajador ? (
          <Text style={styles.errorText}>{errores.porcentajeTrabajador}</Text>
        ) : null}
      </View>

      <View style={styles.fieldContainer}>
        <Text style={styles.label}>% Empresa</Text>
        <TextInput
          value={configuracion.porcentajeEmpresa}
          keyboardType="numeric"
          onChangeText={(text) => handleChange('porcentajeEmpresa', text)}
          style={[styles.input, errores.porcentajeEmpresa && styles.inputError]}
        />
        {errores.porcentajeEmpresa ? (
          <Text style={styles.errorText}>{errores.porcentajeEmpresa}</Text>
        ) : null}
      </View>

      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Estado Activo</Text>
        <Switch
          value={configuracion.estado}
          onValueChange={(value) =>
            setConfiguracion((prev) => ({ ...prev, estado: value }))
          }
        />
      </View>

      <TouchableOpacity style={styles.button} onPress={guardar}>
        <Text style={styles.buttonText}>Guardar</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f2f2f2',
    flexGrow: 1,
  },
  fieldContainer: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    color: '#333',
    marginBottom: 5,
    fontWeight: '600',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    backgroundColor: '#fff',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 12,
    backgroundColor: '#fff',
  },
  inputError: {
    borderColor: 'red',
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: 4,
  },
  button: {
    backgroundColor: '#00b894',
    padding: 15,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});
