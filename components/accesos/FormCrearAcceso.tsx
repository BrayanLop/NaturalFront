import { Button, Card, ChipGroup, EmptyState, Input, LoadingState, Select } from '@/components/ds';
import KeyboardAware from '@/components/KeyboardAware';
import { SPACING, useEstilos, type Tema } from '@/theme';
import { mensajeDeError } from '@/utils/apiError';
import { logger, showError, showSuccess } from '@/utils/logger';
import { hashPassword } from '@/utils/password';
import { ROLES } from '@/utils/roles';
import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { ClienteAccesos } from '../../app/api/accesosClient';
import { Acceso } from '../../app/api/modelos/acceso';

const OPCIONES_ROL = [
  { key: ROLES.TRABAJADOR, label: 'Trabajador' },
  { key: ROLES.SUPER_EMPLEADO, label: 'Super Empleado' },
  { key: ROLES.ADMIN, label: 'Administrador' },
];

interface Props {
  cliente: ClienteAccesos;
  personaIdInicial?: string;
  onCreado: () => void;
}

const crearEstilos = (t: Tema) => ({
  container: { padding: SPACING.lg, backgroundColor: t.colores.fondo, flexGrow: 1 },
  vacio: { flex: 1, justifyContent: 'center' as const, backgroundColor: t.colores.fondo },
});

/** Formulario para darle acceso a una persona que aún no lo tiene. Lo usan el rol 01 y el superadmin. */
export default function FormCrearAcceso({ cliente, personaIdInicial, onCreado }: Props) {
  const estilos = useEstilos(crearEstilos);
  const [sinAcceso, setSinAcceso] = useState<Acceso[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [personaId, setPersonaId] = useState<string>(personaIdInicial ?? '');
  const [nombreUsuario, setNombreUsuario] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [rol, setRol] = useState<string>(ROLES.TRABAJADOR);
  const [errores, setErrores] = useState<{ nombreUsuario?: string; contrasena?: string }>({});

  useEffect(() => {
    (async () => {
      try {
        const todos = await cliente.listar();
        setSinAcceso(todos.filter((a) => !a.tieneAcceso));
      } catch (error) {
        logger.error('Error al cargar personas sin acceso:', error);
        showError(mensajeDeError(error, 'No se pudieron cargar las personas'));
      } finally {
        setCargando(false);
      }
    })();
  }, [cliente]);

  const validar = () => {
    const nuevos: typeof errores = {};
    if (!/^\S{3,50}$/.test(nombreUsuario.trim())) {
      nuevos.nombreUsuario = 'Entre 3 y 50 caracteres, sin espacios';
    }
    if (contrasena.length < 6) {
      nuevos.contrasena = 'Mínimo 6 caracteres';
    }
    setErrores(nuevos);
    return Object.keys(nuevos).length === 0;
  };

  const guardar = async () => {
    if (!personaId) {
      showError('Selecciona la persona a la que le darás acceso');
      return;
    }
    if (!validar()) return;

    setGuardando(true);
    try {
      await cliente.crear({
        personaId: Number(personaId),
        nombreUsuario: nombreUsuario.trim(),
        contrasena: await hashPassword(contrasena),
        rol,
      });
      showSuccess('Acceso creado correctamente');
      onCreado();
    } catch (error) {
      logger.error('Error al crear acceso:', error);
      showError(mensajeDeError(error, 'No se pudo crear el acceso'));
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) return <LoadingState message="Cargando..." />;

  if (sinAcceso.length === 0) {
    return (
      <View style={estilos.vacio}>
        <EmptyState
          icon="checkmark-circle-outline"
          title="Todas las personas ya tienen acceso"
          subtitle="Crea una persona nueva en el módulo Personas para darle acceso"
        />
      </View>
    );
  }

  return (
    <KeyboardAware>
      <ScrollView contentContainerStyle={estilos.container} keyboardShouldPersistTaps="handled">
        <Card padding={SPACING.lg}>
          <Select
            label="Persona"
            placeholder="Seleccionar persona"
            value={personaId || null}
            onChange={setPersonaId}
            options={sinAcceso.map((a) => ({ value: String(a.personaId), label: `${a.nombre} ${a.apellido}` }))}
          />

          <Input
            label="Usuario"
            leftIcon="person-outline"
            value={nombreUsuario}
            onChangeText={setNombreUsuario}
            error={errores.nombreUsuario}
            placeholder="Nombre de usuario"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Input
            label="Contraseña"
            leftIcon="lock-closed-outline"
            value={contrasena}
            onChangeText={setContrasena}
            error={errores.contrasena}
            placeholder="Contraseña inicial"
            secureTextEntry
            autoCapitalize="none"
          />

          <ChipGroup label="Rol" options={OPCIONES_ROL} value={rol} onChange={setRol} />

          <Button title="Crear acceso" icon="checkmark" onPress={guardar} loading={guardando} />
        </Card>
      </ScrollView>
    </KeyboardAware>
  );
}
