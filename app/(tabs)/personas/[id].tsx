import { Button, Input, LoadingState } from '@/components/ds';
import type { IconName } from '@/components/ds';
import { SPACING, useEstilos, type Tema } from '@/theme';
import { toDateInputValue } from '@/utils/formatters';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, KeyboardTypeOptions, ScrollView } from 'react-native';
import { api } from '../../api/api';

const crearEstilos = (t: Tema) => ({
  contenedor: { padding: SPACING.lg, backgroundColor: t.colores.fondo, flexGrow: 1 },
});

export default function EditarPersona() {
  const router = useRouter();
  const estilos = useEstilos(crearEstilos);
  const { id } = useLocalSearchParams<{ id: string }>();

  const [persona, setPersona] = useState({
    nombre: '',
    apellido: '',
    cedula: '',
    residencia: '',
    email: '',
    edad: '',
    celular: '',
    fechaNacimiento: '',
    rol: '', // Campo oculto: se conserva y se envía
  });

  const [errores, setErrores] = useState<Partial<Record<keyof typeof persona, string>>>({});
  const [loading, setLoading] = useState(true);

  const validaciones: Record<keyof typeof persona, { regex: RegExp; mensaje: string }> = {
    nombre: { regex: /^[A-Za-zÁÉÍÓÚáéíóúñÑ\s]{3,}$/, mensaje: 'Nombre inválido' },
    apellido: { regex: /^[A-Za-zÁÉÍÓÚáéíóúñÑ\s]{3,}$/, mensaje: 'Apellido inválido' },
    cedula: { regex: /^\d{6,10}$/, mensaje: 'Cédula inválida (6-10 dígitos)' },
    residencia: { regex: /^.{0,100}$/, mensaje: '' },
    email: { regex: /^[\w.-]+@[\w.-]+\.\w+$/, mensaje: 'Correo inválido' },
    edad: { regex: /^\d{1,3}$/, mensaje: 'Edad inválida' },
    celular: { regex: /^\d{10}$/, mensaje: 'Celular inválido (10 dígitos)' },
    fechaNacimiento: {
      regex: /^\d{4}-\d{2}-\d{2}$/,
      mensaje: 'Fecha inválida (formato YYYY-MM-DD)',
    },
    rol: { regex: /^.{0,10}$/, mensaje: '' }, // no visible, pero se mantiene
  };

  const handleChange = (campo: keyof typeof persona, valor: string) => {
    setPersona((prev) => ({ ...prev, [campo]: valor }));
    const { regex, mensaje } = validaciones[campo];
    setErrores((prev) => ({
      ...prev,
      [campo]: valor === '' || regex.test(valor) ? '' : mensaje,
    }));
  };

  // Al cargar persona, si no hay fechaNacimiento, asigna la fecha actual (no se muestra)
  const cargarPersona = async () => {
    try {
      const res = await api.get(`/Persona/Obtener/${id}`);
      const data = res.data;
      setPersona({
        nombre: data.nombre || '',
        apellido: data.apellido || '',
        cedula: data.cedula || '',
        residencia: data.residencia || '',
        email: data.email || '',
        edad: data.edad?.toString() || '',
        celular: data.celular || '',
        fechaNacimiento: data.fechaNacimiento?.split('T')[0] || toDateInputValue(new Date()),
        rol: data.rol || '02',
      });
    } catch (err) {
      Alert.alert('Error', 'No se pudo cargar la persona');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarPersona();
  }, [id]);

  const guardarCambios = async () => {
    const nuevosErrores: Partial<Record<keyof typeof persona, string>> = {};

    (Object.keys(persona) as (keyof typeof persona)[]).forEach((campo) => {
      const valor = persona[campo];
      const { mensaje } = validaciones[campo];
      if (!valor && campo !== 'residencia' && campo !== 'rol') {
        nuevosErrores[campo] = mensaje;
      }
    });

    if (Object.keys(nuevosErrores).length > 0) {
      setErrores(nuevosErrores);
      Alert.alert('Error', 'Revisa los campos con errores');
      return;
    }

    try {
      await api.put(
        `/Persona/Actualizar/${id}`,
        {
          ...persona,
          edad: parseInt(persona.edad),
          empresa: {}, // Se envía el objeto empresa vacío
        }
      );
      Alert.alert('Éxito', 'Persona actualizada correctamente');
      router.back();
    } catch (err) {
      Alert.alert('Error', 'No se pudo actualizar la persona');
    }
  };

  const campos: {
    key: keyof typeof persona;
    label: string;
    icon: IconName;
    keyboardType?: KeyboardTypeOptions;
  }[] = [
    { key: 'nombre', label: 'Nombre', icon: 'person-outline' },
    { key: 'apellido', label: 'Apellido', icon: 'person-outline' },
    { key: 'cedula', label: 'Cédula', icon: 'id-card-outline', keyboardType: 'numeric' },
    { key: 'residencia', label: 'Residencia', icon: 'home-outline' },
    { key: 'email', label: 'Correo electrónico', icon: 'mail-outline', keyboardType: 'email-address' },
    { key: 'edad', label: 'Edad', icon: 'calendar-outline', keyboardType: 'numeric' },
    { key: 'celular', label: 'Celular', icon: 'call-outline', keyboardType: 'numeric' },
  ];

  if (loading) {
    return <LoadingState message="Cargando información..." />;
  }

  return (
    <ScrollView contentContainerStyle={estilos.contenedor} keyboardShouldPersistTaps="handled">
      {campos.map(({ key, label, icon, keyboardType }) => (
        <Input
          key={key}
          label={label}
          value={persona[key]}
          onChangeText={(text) => handleChange(key, text)}
          error={errores[key] || undefined}
          placeholder={label}
          keyboardType={keyboardType}
          leftIcon={icon}
          autoCapitalize={key === 'email' ? 'none' : undefined}
        />
      ))}

      <Button title="Guardar cambios" onPress={guardarCambios} />
    </ScrollView>
  );
}
