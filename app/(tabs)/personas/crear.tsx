import { Button, Input } from '@/components/ds';
import type { IconName } from '@/components/ds';
import KeyboardAware from '@/components/KeyboardAware';
import { SPACING, useEstilos, type Tema } from '@/theme';
import { toDateInputValue } from '@/utils/formatters';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardTypeOptions, ScrollView } from 'react-native';
import { api } from '../../api/api';
import { logger } from '@/utils/logger';

const crearEstilos = (t: Tema) => ({
  contenedor: { padding: SPACING.lg, backgroundColor: t.colores.fondo, flexGrow: 1 },
});

export default function CrearPersona() {
  const router = useRouter();
  const estilos = useEstilos(crearEstilos);

  // Inicializa persona con fechaNacimiento actual, pero no muestres ni input ni texto
  const [persona, setPersona] = useState({
    nombre: '',
    apellido: '',
    cedula: '',
    residencia: '',
    email: '',
    edad: '',
    celular: '',
    fechaNacimiento: toDateInputValue(new Date()),
  });

  const [errores, setErrores] = useState<Partial<Record<keyof typeof persona, string>>>({});

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
  };

  const handleChange = (campo: keyof typeof persona, valor: string) => {
    setPersona((prev) => ({ ...prev, [campo]: valor }));
    const { regex, mensaje } = validaciones[campo];
    setErrores((prev) => ({
      ...prev,
      [campo]: valor === '' || regex.test(valor) ? '' : mensaje,
    }));
  };

  const guardar = async () => {
    const nuevosErrores: Partial<Record<keyof typeof persona, string>> = {};

    (Object.keys(persona) as (keyof typeof persona)[]).forEach((campo) => {
      const valor = persona[campo];
      const { regex, mensaje } = validaciones[campo];
      if (campo !== 'residencia' && (!valor || !regex.test(valor))) {
        nuevosErrores[campo] = mensaje;
      }
    });

    if (Object.keys(nuevosErrores).length > 0) {
      setErrores(nuevosErrores);
      Alert.alert('Error', 'Revisa los campos con errores');
      return;
    }

    try {
      await api.post('/Persona/Crear', {
        ...persona,
        edad: parseInt(persona.edad),
        rol: "02",
        empresa: {} // Se envía el objeto empresa vacío
      });

      Alert.alert('Éxito', 'Persona creada correctamente');
      router.back();
    } catch (error) {
      logger.error('Error al crear persona:', error);
      Alert.alert('Error', 'No se pudo crear la persona');
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

  return (
    <KeyboardAware>
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

        <Button title="Guardar" onPress={guardar} />
      </ScrollView>
    </KeyboardAware>
  );
}
