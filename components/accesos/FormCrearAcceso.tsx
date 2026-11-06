import EmptyState from '@/components/EmptyState';
import FilterChips from '@/components/FilterChips';
import FormField from '@/components/FormField';
import KeyboardAware from '@/components/KeyboardAware';
import LoadingView from '@/components/LoadingView';
import PrimaryButton from '@/components/PrimaryButton';
import { COLORS, RADIUS, SPACING, commonStyles } from '@/constants/theme';
import { mensajeDeError } from '@/utils/apiError';
import { logger, showError, showSuccess } from '@/utils/logger';
import { hashPassword } from '@/utils/password';
import { ROLES } from '@/utils/roles';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';
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

/** Formulario para darle acceso a una persona que aún no lo tiene. Lo usan el rol 01 y el superadmin. */
export default function FormCrearAcceso({ cliente, personaIdInicial, onCreado }: Props) {
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

  if (cargando) return <LoadingView message="Cargando..." />;

  if (sinAcceso.length === 0) {
    return (
      <View style={styles.vacio}>
        <EmptyState
          message="Todas las personas ya tienen acceso"
          icon="✅"
          subtitle="Crea una persona nueva en el módulo Personas para darle acceso"
        />
      </View>
    );
  }

  return (
    <KeyboardAware>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.formCard}>
          <FilterChips
            label="Persona"
            options={sinAcceso.map((a) => ({ key: String(a.personaId), label: `${a.nombre} ${a.apellido}` }))}
            selected={personaId}
            onSelect={setPersonaId}
          />

          <FormField label="Usuario" error={errores.nombreUsuario}>
            <TextInput
              value={nombreUsuario}
              onChangeText={setNombreUsuario}
              style={[commonStyles.input, errores.nombreUsuario && styles.inputError]}
              placeholder="Nombre de usuario"
              autoCapitalize="none"
              autoCorrect={false}
              placeholderTextColor={COLORS.textTertiary}
            />
          </FormField>

          <FormField label="Contraseña" error={errores.contrasena}>
            <TextInput
              value={contrasena}
              onChangeText={setContrasena}
              style={[commonStyles.input, errores.contrasena && styles.inputError]}
              placeholder="Contraseña inicial"
              secureTextEntry
              autoCapitalize="none"
              placeholderTextColor={COLORS.textTertiary}
            />
          </FormField>

          <FilterChips label="Rol" options={OPCIONES_ROL} selected={rol} onSelect={setRol} />

          <PrimaryButton title="Crear acceso" onPress={guardar} loading={guardando} />
        </View>
      </ScrollView>
    </KeyboardAware>
  );
}

const styles = StyleSheet.create({
  container: { padding: SPACING.lg, backgroundColor: COLORS.background, flexGrow: 1 },
  formCard: { backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: SPACING.lg },
  inputError: { borderColor: COLORS.error },
  vacio: { flex: 1, justifyContent: 'center', backgroundColor: COLORS.background },
});
