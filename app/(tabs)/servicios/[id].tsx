import { logger, showConfirm, showError, showSuccess } from '@/utils/logger';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { MaskedTextInput } from 'react-native-mask-text';
import { servicioService } from '../../api/services';

export default function ServicioDetalle() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [precio, setPrecio] = useState('');
  const [disponible, setDisponible] = useState(false);
  const [errores, setErrores] = useState<{ [key in CampoValidable]?: string }>({});
  const [loading, setLoading] = useState(true);

  const validaciones = {
    nombre: { regex: /^.{3,50}$/, mensaje: 'Nombre requerido (3-50 caracteres)' },
    precio: { regex: /^\d+$/, mensaje: 'Precio inválido (solo números)' },
  };

  type CampoValidable = keyof typeof validaciones;

  useEffect(() => {
    if (id) {
      servicioService.obtenerPorId(Number(id))
        .then(res => {
          const data = res.data;
          setNombre(data.nombre);
          setDescripcion(data.descripcion);
          setPrecio(data.precio.toString());
          setDisponible(data.disponible);
        })
        .catch(err => {
          logger.error('Error al cargar servicio:', err);
          showError('No se pudo cargar el servicio');
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
      showError('Revisa los campos con errores', 'Error de validación');
      return;
    }

    try {
      await servicioService.actualizar(Number(id), {
        id: Number(id),
        nombre,
        descripcion,
        precio: parseInt(precio),
        disponible,
        fechaCreacion: new Date().toISOString(),
      });

      showSuccess('Servicio actualizado');
      router.back();
    } catch (error) {
      logger.error('Error al actualizar:', error);
      showError('No se pudo actualizar el servicio');
    }
  };

const eliminar = async () => {
  const confirmar = await showConfirm('¿Eliminar este servicio?');

  if (!confirmar) return;

  try {
    logger.log("Eliminando servicio con id:", id);
    await servicioService.eliminar(Number(id));
    
    showSuccess("Servicio eliminado correctamente");
    router.back();
  } catch (error) {
    logger.error("Error al eliminar:", error);
    showError("No se pudo eliminar el servicio");
  }
};

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#00b894" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Nombre */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Nombre</Text>
        <TextInput
          value={nombre}
          onChangeText={(text) => handleChange('nombre', text)}
          style={[styles.input, errores.nombre && styles.inputError]}
          placeholder="Nombre del servicio"
        />
        {errores.nombre && <Text style={styles.errorText}>{errores.nombre}</Text>}
      </View>

      {/* Descripción */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Descripción</Text>
        <TextInput
          value={descripcion}
          onChangeText={setDescripcion}
          style={styles.input}
          placeholder="Descripción detallada (opcional)"
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
          onChangeText={(_, unmasked) => handleChange('precio', unmasked)}
          style={[styles.input, errores.precio && styles.inputError]}
          keyboardType="numeric"
          placeholder="Precio en pesos"
        />
        {errores.precio && <Text style={styles.errorText}>{errores.precio}</Text>}
      </View>

      {/* Disponible */}
      <View style={styles.switchRow}>
        <Text style={styles.label}>Estado</Text>
        <Switch value={disponible} onValueChange={setDisponible} />
      </View>

      {/* Botones */}
      <TouchableOpacity style={styles.button} onPress={actualizar}>
        <Text style={styles.buttonText}>Guardar</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.deleteButton} onPress={eliminar}>
        <Text style={styles.buttonText}>Eliminar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f2f2f2' },
  fieldContainer: { marginBottom: 15 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 5 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 10,
    backgroundColor: '#fff',
  },
  inputError: { borderColor: 'red' },
  errorText: { color: 'red', fontSize: 12, marginTop: 4 },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  button: {
    backgroundColor: '#0984e3',
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
});
