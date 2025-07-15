import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActionSheetIOS,
  ActivityIndicator,
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

export default function ConfiguracionDetalle() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [configuracion, setConfiguracion] = useState({
    id: 0,
    nombreServicio: '',
    servicioId: '',
    porcentajeTrabajador: '',
    porcentajeEmpresa: '',
    estado: true,
  });

  const [loading, setLoading] = useState(true);
  const [errores, setErrores] = useState<{ [campo: string]: string }>({});
  const [servicios, setServicios] = useState<{ id: number; nombre: string }[]>([]);

useEffect(() => {
  if (id) {
    // Cargar la configuración
    api
      .get(`ConfiguracionServicio/Obtener/${id}`)
      .then((res) => {
        const data = res.data;
        setConfiguracion({
          id: data.id,
          nombreServicio: data.nombreServicio,
          servicioId: data.servicioId.toString(),
          porcentajeTrabajador: data.porcentajeTrabajador.toString(),
          porcentajeEmpresa: data.porcentajeEmpresa.toString(),
          estado: data.estado,
        });
      })
      .catch((err) => {
        console.error(err);
        Alert.alert('Error', 'No se pudo cargar la configuración');
      })
      .finally(() => setLoading(false));

    // 🔥 Aquí cargas los servicios
    api
      .get('/Servicio/Obtener')
      .then((res) => setServicios(res.data))
      .catch((err) => {
        console.error('Error al cargar servicios', err);
        Alert.alert('Error', 'No se pudieron cargar los servicios');
      });
  }
}, [id]);

  const handleChange = (campo: string, valor: string) => {
    setConfiguracion((prev) => ({ ...prev, [campo]: valor }));
  };

  const actualizar = async () => {
    const pt = parseFloat(configuracion.porcentajeTrabajador);
    const pe = parseFloat(configuracion.porcentajeEmpresa);

    if (pt + pe !== 100) {
      Alert.alert('Error', 'La suma de porcentajes debe ser 100%');
      return;
    }

    try {
      await api.put(`ConfiguracionServicio/Actualizar/${id}`, configuracion);
      Alert.alert('Éxito', 'Configuración actualizada');
      router.back();
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'No se pudo actualizar');
    }
  };

  const eliminar = async () => {
    Alert.alert('Confirmar', '¿Eliminar esta configuración?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`ConfiguracionServicio/Eliminar/${id}`);
            Alert.alert('Eliminado', 'Configuración eliminada');
            router.back();
          } catch (error) {
            console.error(error);
            Alert.alert('Error', 'No se pudo eliminar');
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#00b894" />
      </View>
    );
  }
  
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


  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Servicio</Text>
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
      </View>

      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Porcentaje trabajador</Text>
        <TextInput
          value={configuracion.porcentajeTrabajador}
          keyboardType="numeric"
          onChangeText={(text) => handleChange('porcentajeTrabajador', text)}
          style={styles.input}
        />
      </View>

      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Porcentaje empresa</Text>
        <TextInput
          value={configuracion.porcentajeEmpresa}
          keyboardType="numeric"
          onChangeText={(text) => handleChange('porcentajeEmpresa', text)}
          style={styles.input}
        />
      </View>

      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Estado</Text>
        <Switch
          value={configuracion.estado}
          onValueChange={(value) => setConfiguracion((prev) => ({ ...prev, estado: value }))}
        />
      </View>

      <TouchableOpacity style={styles.button} onPress={actualizar}>
        <Text style={styles.buttonText}>Actualizar</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.deleteButton} onPress={eliminar}>
        <Text style={styles.buttonText}>Eliminar</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20, backgroundColor: '#f2f2f2' },
  fieldContainer: { marginBottom: 15 },
  label: {
    fontSize: 14,
    color: '#333',
    marginBottom: 5,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 10,
    backgroundColor: '#fff',
  },
  button: {
    backgroundColor: '#00b894',
    padding: 15,
    borderRadius: 6,
    alignItems: 'center',
    marginBottom: 10,
  },
  deleteButton: {
    backgroundColor: '#d63031',
    padding: 15,
    borderRadius: 6,
    alignItems: 'center',
  },
  buttonText: { color: 'white', fontWeight: 'bold' },
    inputError: {
    borderColor: 'red',
  }
});
