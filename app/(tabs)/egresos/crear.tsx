import FormField from '@/components/FormField';
import LoadingView from '@/components/LoadingView';
import PrimaryButton from '@/components/PrimaryButton';
import SimpleDatePicker from '@/components/SimpleDatePicker';
import { commonStyles } from '@/constants/theme';
import { useAuth } from '@/context/authContext';
import { toDateInputValue } from '@/utils/formatters';
import { logger, showError, showSuccess } from '@/utils/logger';
import { isAdmin } from '@/utils/roles';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { MaskedTextInput } from 'react-native-mask-text';
import { api } from '../../api/api';
import { Persona } from '../../api/modelos/persona';

export default function CrearEgreso() {
  const router = useRouter();
  const { usuario } = useAuth();
  
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [personaId, setPersonaId] = useState<number | null>(null);
  const [valorEgreso, setValorEgreso] = useState('');
  const [motivo, setMotivo] = useState('');
  const [seDescuenta, setSeDescuenta] = useState(false);
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
        SeDescuenta: seDescuenta
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

  const onChangeFechaEgreso = (_: any, selectedDate?: Date) => {
    if (!selectedDate) return;
    setFechaEgreso(toDateInputValue(selectedDate));
    setFechaModalVisible(null);
  };

  if (!esAdmin) {
    return (
      <View style={styles.container}>
        <Text style={commonStyles.emptyText}>No tienes permisos para registrar egresos</Text>
      </View>
    );
  }

  if (loadingPersonas) {
    return <LoadingView />;
  }

  if (personas.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={commonStyles.emptyText}>No hay personas disponibles</Text>
      </View>
    );
  }

  const personaSeleccionada = personas.find((p) => p.id === personaId);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Selector de persona */}
      <FormField label="Persona">
        {Platform.OS === 'web' ? (
          <select
            value={personaId || ''}
            onChange={(e) => setPersonaId(Number(e.target.value))}
            style={{
              ...commonStyles.input,
              height: 45,
              fontSize: 14,
            } as any}
          >
            <option value="">Seleccionar persona</option>
            {personas.map((persona) => (
              <option key={persona.id} value={persona.id}>
                {persona.nombre} {persona.apellido}
              </option>
            ))}
          </select>
        ) : (
          <View>
            <TouchableOpacity
              style={[commonStyles.input, styles.picker]}
              onPress={() => {}}
            >
              <Text style={{ color: personaId ? '#000' : '#999' }}>
                {personaId
                  ? `${personas.find(p => p.id === personaId)?.nombre} ${personas.find(p => p.id === personaId)?.apellido}`
                  : 'Seleccionar persona'}
              </Text>
            </TouchableOpacity>
            {personas.map((persona) => (
              <TouchableOpacity
                key={persona.id}
                style={[
                  styles.personaOption,
                  personaId === persona.id && styles.personaOptionSelected,
                ]}
                onPress={() => setPersonaId(persona.id)}
              >
                <Text
                  style={[
                    styles.personaOptionText,
                    personaId === persona.id && styles.personaOptionTextSelected,
                  ]}
                >
                  {persona.nombre} {persona.apellido}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </FormField>

      <FormField label="Valor del egreso">
        <MaskedTextInput
          type="currency"
          options={{
            prefix: '$',
            decimalSeparator: ',',
            groupSeparator: '.',
            precision: 0,
          }}
          value={valorEgreso}
          onChangeText={(_, unmasked) => setValorEgreso(unmasked)}
          style={commonStyles.input}
          keyboardType="numeric"
          placeholder="Ej: $50.000"
        />
      </FormField>

      <FormField label="Motivo">
        <TextInput
          value={motivo}
          onChangeText={setMotivo}
          style={[commonStyles.input, { minHeight: 100 }]}
          placeholder="Describe el motivo del egreso..."
          multiline
          numberOfLines={4}
          maxLength={256}
        />
        <Text style={styles.charCount}>{motivo.length}/256</Text>
      </FormField>

      <FormField label="Fecha del egreso">
        {Platform.OS === 'web' ? (
          <input
            type="date"
            value={fechaEgreso}
            onChange={e => setFechaEgreso(e.target.value)}
            style={commonStyles.input as any}
          />
        ) : (
          <TouchableOpacity onPress={() => setFechaModalVisible('fecha')}>
            <TextInput
              style={commonStyles.input}
              value={fechaEgreso}
              editable={false}
              placeholder="YYYY-MM-DD"
            />
          </TouchableOpacity>
        )}
      </FormField>

      {/* Modal de fecha para dispositivos */}
      {Platform.OS !== 'web' && fechaModalVisible && (
        <SimpleDatePicker
          value={fechaEgreso}
          onChange={onChangeFechaEgreso}
          visible={!!fechaModalVisible}
          onClose={() => setFechaModalVisible(null)}
          title="Selecciona la fecha del egreso"
        />
      )}

      <View style={styles.switchRow}>
         <Text style={commonStyles.label}>Aplica para descuento al pagar</Text>
         <Switch value={seDescuenta} onValueChange={setSeDescuenta} />
      </View>
      
      <PrimaryButton
        title="Registrar egreso"
        onPress={guardar}
        loading={loading}
        variant="blue"
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    ...commonStyles.scrollContainer,
  },
    switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  picker: {
    justifyContent: 'center',
  },
  personaOption: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#dfe6e9',
    backgroundColor: '#fff',
  },
  personaOptionSelected: {
    backgroundColor: '#e3f2fd',
  },
  personaOptionText: {
    fontSize: 14,
    color: '#333',
  },
  personaOptionTextSelected: {
    color: '#0984e3',
    fontWeight: '600',
  },
  charCount: {
    fontSize: 12,
    color: '#636e72',
    textAlign: 'right',
    marginTop: 4,
  },
});
