import { AppText, Button, ChipGroup, DateField, EmptyState, Input, LoadingState, Select, ToggleRow } from '@/components/ds';
import KeyboardAware from '@/components/KeyboardAware';
import SimpleDatePicker from '@/components/SimpleDatePicker';
import { useAuth } from '@/context/authContext';
import { SPACING, useEstilos, type Tema } from '@/theme';
import { toDateInputValue } from '@/utils/formatters';
import { logger, showError, showSuccess } from '@/utils/logger';
import { isAdmin } from '@/utils/roles';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { api } from '../../api/api';
import { Persona } from '../../api/modelos/persona';

const crearEstilos = (t: Tema) => ({
  contenedor: { flexGrow: 1, padding: SPACING.lg, paddingBottom: SPACING.huge, backgroundColor: t.colores.fondo },
  vacio: { flex: 1, padding: SPACING.lg, backgroundColor: t.colores.fondo },
  filaFecha: { flexDirection: 'row' as const, marginBottom: SPACING.lg },
  contador: { textAlign: 'right' as const, marginTop: -SPACING.md, marginBottom: SPACING.lg },
  boton: { marginTop: SPACING.md },
});

/** Formatea los dígitos como moneda sin decimales: 50000 -> $50.000 */
const formatearValor = (digitos: string) => (digitos ? `$${Number(digitos).toLocaleString('es-CO')}` : '');

export default function CrearEgreso() {
  const router = useRouter();
  const { usuario } = useAuth();
  const estilos = useEstilos(crearEstilos);

  const [personas, setPersonas] = useState<Persona[]>([]);
  const [personaId, setPersonaId] = useState<number | null>(null);
  const [valorEgreso, setValorEgreso] = useState('');
  const [motivo, setMotivo] = useState('');
  const [seDescuenta, setSeDescuenta] = useState(false);
  const [formaPago, setFormaPago] = useState<'E' | 'T' | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingPersonas, setLoadingPersonas] = useState(true);

  // Estado para el modal de fecha
  const [fechaModalVisible, setFechaModalVisible] = useState<null | 'fecha'>(null);
  const [fechaEgreso, setFechaEgreso] = useState(() => toDateInputValue(new Date()));

  const esAdmin = isAdmin(usuario?.rol);

  useEffect(() => {
    if (!esAdmin) return;

    const cargarPersonas = async () => {
      try {
        const response = await api.get('/Persona/Obtener');
        setPersonas(response.data || []);
      } catch (error) {
        logger.error('Error al cargar personas:', error);
        showError('No se pudieron cargar las personas');
      } finally {
        setLoadingPersonas(false);
      }
    };

    cargarPersonas();
  }, [esAdmin]);

  const guardar = async () => {
    if (!personaId || !valorEgreso || !motivo) {
      showError('Todos los campos son requeridos', 'Campos obligatorios');
      return;
    }

    if (!formaPago) {
      showError('Selecciona el método de pago del egreso', 'Campos obligatorios');
      return;
    }

    if (!esAdmin) {
      showError('No tienes permisos para realizar esta acción');
      return;
    }

    setLoading(true);
    try {
      const personaSeleccionada = personas.find(p => p.id === personaId);
      const payload = {
        PersonaId: personaId,
        NombrePersona: personaSeleccionada ? `${personaSeleccionada.nombre} ${personaSeleccionada.apellido}` : '',
        ValorEgreso: parseFloat(valorEgreso),
        Motivo: motivo,
        SeDescuenta: seDescuenta,
        FormaPago: formaPago,
      };

      await api.post('/EgresosEmpresa/RegistrarEgreso', payload);

      showSuccess('Egreso registrado correctamente');
      router.back();
    } catch (error: any) {
      logger.error('Error al registrar egreso:', error);
      showError('No se pudo registrar el egreso');
    } finally {
      setLoading(false);
    }
  };

  if (!esAdmin) {
    return (
      <View style={estilos.vacio}>
        <EmptyState icon="lock-closed-outline" title="No tienes permisos para registrar egresos" />
      </View>
    );
  }

  if (loadingPersonas) {
    return <LoadingState />;
  }

  if (personas.length === 0) {
    return (
      <View style={estilos.vacio}>
        <EmptyState icon="people-outline" title="No hay personas disponibles" />
      </View>
    );
  }

  return (
    <KeyboardAware>
      <ScrollView contentContainerStyle={estilos.contenedor} keyboardShouldPersistTaps="handled">
        <Select
          label="Persona"
          placeholder="Seleccionar persona"
          value={personaId !== null ? String(personaId) : null}
          options={personas.map((p) => ({ value: String(p.id), label: `${p.nombre} ${p.apellido}` }))}
          onChange={(v) => setPersonaId(Number(v))}
        />

        <Input
          label="Valor del egreso"
          leftIcon="cash-outline"
          value={formatearValor(valorEgreso)}
          onChangeText={(texto) => setValorEgreso(texto.replace(/\D/g, ''))}
          keyboardType="numeric"
          placeholder="Ej: $50.000"
        />

        <Input
          label="Motivo"
          value={motivo}
          onChangeText={setMotivo}
          placeholder="Describe el motivo del egreso..."
          multiline
          numberOfLines={4}
          maxLength={256}
        />
        <AppText variante="nota" tono="tenue" style={estilos.contador}>
          {motivo.length}/256
        </AppText>

        <View style={estilos.filaFecha}>
          <DateField label="Fecha del egreso" value={fechaEgreso} onPress={() => setFechaModalVisible('fecha')} />
        </View>

        {/* Modal de fecha */}
        {fechaModalVisible && (
          <SimpleDatePicker
            value={fechaEgreso}
            onChange={(dateStr) => {
              setFechaEgreso(dateStr);
              setFechaModalVisible(null);
            }}
            visible={!!fechaModalVisible}
            onClose={() => setFechaModalVisible(null)}
            title="Selecciona la fecha del egreso"
          />
        )}

        <ChipGroup
          label="Método de pago"
          value={formaPago ?? ''}
          onChange={(k) => setFormaPago(k as 'E' | 'T')}
          options={[
            { key: 'E', label: 'Efectivo', icon: 'cash-outline' },
            { key: 'T', label: 'Transferencia', icon: 'swap-horizontal-outline' },
          ]}
        />

        <ToggleRow
          label="Aplica para descuento al pagar"
          description={seDescuenta ? 'Se descontará en la próxima liquidación' : 'No se descuenta'}
          value={seDescuenta}
          onValueChange={setSeDescuenta}
          style={{ marginBottom: SPACING.lg }}
        />

        <Button title="Registrar egreso" icon="checkmark" onPress={guardar} loading={loading} style={estilos.boton} />
      </ScrollView>
    </KeyboardAware>
  );
}
