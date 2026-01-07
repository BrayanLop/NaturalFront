import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
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

export default function CrearConfiguracion() {
  const router = useRouter();

  const [configuracion, setConfiguracion] = useState({
    servicioId: '',
    porcentajeTrabajador: '',
    porcentajeEmpresa: '',
    estado: true,
  });

  const [errores, setErrores] =
    useState<Partial<Record<keyof typeof configuracion, string>>>({});
  const [servicios, setServicios] =
    useState<{ id: number; nombre: string }[]>([]);
  const [mostrarModal, setMostrarModal] = useState(false);

  /* ===================== CARGAR SERVICIOS ===================== */
  useEffect(() => {
    api
      .get('/Servicio/Obtener')
      .then((res) => setServicios(res.data))
      .catch(() => {
        Alert.alert('Error', 'No se pudieron cargar los servicios');
      });
  }, []);

  /* ===================== HANDLER ===================== */
  const handleChange = (campo: keyof typeof configuracion, valor: string) => {
    setConfiguracion((prev) => ({ ...prev, [campo]: valor }));
    setErrores((prev) => ({ ...prev, [campo]: '' }));
  };

  /* ===================== GUARDAR ===================== */
  const guardar = async () => {
    const pt = parseFloat(configuracion.porcentajeTrabajador);
    const pe = parseFloat(configuracion.porcentajeEmpresa);
    const servicioId = parseInt(configuracion.servicioId);

    if (!configuracion.servicioId) {
      setErrores((prev) => ({ ...prev, servicioId: 'Seleccione un servicio' }));
      Alert.alert('Error', 'Seleccione un servicio');
      return;
    }

    if (isNaN(pt) || isNaN(pe)) {
      Alert.alert('Error', 'Porcentajes inválidos');
      return;
    }

    if (pt + pe !== 100) {
      Alert.alert('Error', 'La suma de porcentajes debe ser 100%');
      return;
    }

    try {
      await api.post('/ConfiguracionServicio/Crear', {
        servicioId,
        porcentajeTrabajador: pt,
        porcentajeEmpresa: pe,
        estado: configuracion.estado,
      });

      Alert.alert('Éxito', 'Configuración creada');
      router.back();
    } catch (error) {
      console.error('Error al guardar', error);
      Alert.alert('Error', 'No se pudo guardar la configuración');
    }
  };

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
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              handleChange('servicioId', e.target.value)
            }
            style={styles.webSelect as unknown as React.CSSProperties}
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
            {/* MOBILE */}
            <TouchableOpacity
              style={[
                styles.select,
                errores.servicioId && styles.inputError,
              ]}
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
                <Pressable style={styles.modal}>
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
                </Pressable>
              </Pressable>
            </Modal>
          </>
        )}

        {errores.servicioId && (
          <Text style={styles.errorText}>{errores.servicioId}</Text>
        )}
      </View>

      {/* ===================== PORCENTAJES ===================== */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>% Trabajador</Text>
        <TextInput
          value={configuracion.porcentajeTrabajador}
          keyboardType="numeric"
          onChangeText={(text) => handleChange('porcentajeTrabajador', text)}
          style={styles.input}
        />
      </View>

      <View style={styles.fieldContainer}>
        <Text style={styles.label}>% Empresa</Text>
        <TextInput
          value={configuracion.porcentajeEmpresa}
          keyboardType="numeric"
          onChangeText={(text) => handleChange('porcentajeEmpresa', text)}
          style={styles.input}
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

      {/* ===================== BOTÓN ===================== */}
      <TouchableOpacity style={styles.button} onPress={guardar}>
        <Text style={styles.buttonText}>Guardar</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

/* ===================== STYLES ===================== */
const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f2f2f2',
    flexGrow: 1,
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
  inputError: {
    borderColor: 'red',
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: 4,
  },

  /* SELECT MOBILE */
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

  /* SELECT WEB */
  webSelect: {
    width: '100%',
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ced4da',
    backgroundColor: '#fff',
  },

  /* MODAL */
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
    backgroundColor: '#00b894',
    padding: 15,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
