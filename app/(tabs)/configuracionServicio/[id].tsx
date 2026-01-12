import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
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
    servicioId: '',
    porcentajeTrabajador: '',
    porcentajeEmpresa: '',
    estado: true,
  });

  const [servicios, setServicios] = useState<{ id: number; nombre: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [mostrarModal, setMostrarModal] = useState(false);

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
      console.error(error);
      Alert.alert('Error', 'No se pudo actualizar la configuración');
    }
  };

  /* ===================== ELIMINAR ===================== */
const eliminarConfiguracion = () => {
  if (!id) {
    alert('ID no válido');
    return;
  }

  if (Platform.OS === 'web') {
    // Confirmación simple en web
    if (!window.confirm('¿Eliminar esta configuración?')) return;

    (async () => {
      try {
        await api.delete(`/ConfiguracionServicio/Eliminar/${id}`);
        alert('Configuración eliminada');
        router.back();
      } catch (error) {
        console.error(error);
        alert('No se pudo eliminar');
      }
    })();
  } else {
    // Alert nativo en móvil
    Alert.alert('Confirmar', '¿Eliminar esta configuración?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () => {
          (async () => {
            try {
              await api.delete(`/ConfiguracionServicio/Eliminar/${id}`);
              Alert.alert('Eliminado', 'Configuración eliminada');
              router.back();
            } catch (error) {
              console.error(error);
              Alert.alert('Error', 'No se pudo eliminar');
            }
          })();
        },
      },
    ]);
  }
};

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#00b894" />
      </View>
    );
  }

  const servicioSeleccionado = servicios.find(
    (s) => s.id === parseInt(configuracion.servicioId)
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* ===================== SERVICIO ===================== */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Servicio</Text>

        {/* WEB */}
        {Platform.OS === 'web' ? (
          <select
            value={configuracion.servicioId}
            onChange={(e) => handleChange('servicioId', e.target.value)}
            style={styles.webSelect as any}
          >
            <option value="">Seleccione un servicio</option>
            {servicios.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nombre}
              </option>
            ))}
          </select>
        ) : (
          <>
            <TouchableOpacity
              style={styles.select}
              onPress={() => setMostrarModal(true)}
            >
              <Text
                style={[
                  styles.selectText,
                  !configuracion.servicioId && styles.placeholder,
                ]}
              >
                {servicioSeleccionado?.nombre || 'Seleccione un servicio'}
              </Text>
              <Ionicons name="chevron-down" size={18} color="#6c757d" />
            </TouchableOpacity>

            <Modal transparent visible={mostrarModal} animationType="fade">
              <Pressable
                style={styles.overlay}
                onPress={() => setMostrarModal(false)}
              >
                <View style={styles.modal}>
                  {servicios.map((s) => (
                    <Pressable
                      key={s.id}
                      style={styles.modalItem}
                      onPress={() => {
                        handleChange('servicioId', s.id.toString());
                        setMostrarModal(false);
                      }}
                    >
                      <Text>{s.nombre}</Text>
                    </Pressable>
                  ))}
                </View>
              </Pressable>
            </Modal>
          </>
        )}
      </View>

      {/* ===================== PORCENTAJES ===================== */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Porcentaje empresa</Text>
        <TextInput
          value={configuracion.porcentajeEmpresa}
          keyboardType="numeric"
          onChangeText={setPorcentajeEmpresa}
          style={styles.input}
        />
      </View>

      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Porcentaje trabajador</Text>
        <TextInput
          value={configuracion.porcentajeTrabajador}
          keyboardType="numeric"
          editable={false}
          style={[styles.input, styles.inputDisabled]}
        />
      </View>

      {/* ===================== ESTADO ===================== */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Estado</Text>
        <Switch
          value={configuracion.estado}
          onValueChange={(value) =>
            setConfiguracion((prev) => ({ ...prev, estado: value }))
          }
        />
      </View>

      {/* ===================== BOTONES ===================== */}
      <TouchableOpacity style={styles.button} onPress={actualizarConfiguracion}>
        <Text style={styles.buttonText}>Actualizar</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.deleteButton} onPress={eliminarConfiguracion}>
        <Text style={styles.buttonText}>Eliminar</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

/* ===================== STYLES ===================== */
const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fieldContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
    color: '#212529',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 6,
    padding: 12,
    backgroundColor: '#fff',
  },
  select: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  selectText: {
    color: '#212529',
  },
  placeholder: {
    color: '#6c757d',
  },
  webSelect: {
    width: '100%',
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ced4da',
    backgroundColor: '#fff',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 8,
  },
  modalItem: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  button: {
    backgroundColor: '#0d6efd',
    padding: 14,
    borderRadius: 6,
    alignItems: 'center',
    marginBottom: 10,
  },
  deleteButton: {
    backgroundColor: '#dc3545',
    padding: 14,
    borderRadius: 6,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  inputDisabled: {
    backgroundColor: '#e9ecef',
    color: '#6c757d',
  },
});
