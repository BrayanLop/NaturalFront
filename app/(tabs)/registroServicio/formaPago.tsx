import BackButton from '@/components/BackButton';
import LoadingView from '@/components/LoadingView';
import { COLORS } from '@/constants/theme';
import { useAuth } from '@/context/authContext';
import { formatCurrency } from '@/utils/formatters';
import { logger, showError, showSuccess } from '@/utils/logger';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { api } from '../../api/api';

type FormaPago = 'T' | 'E';

interface Persona {
  id: number;
  nombre: string;
  apellido: string;
}

interface Servicio {
  id: number;
  nombre: string;
  precio: number;
}

export default function ResumenYFormaPago() {
  const router = useRouter();
  const { usuario } = useAuth();
  const { persona: personaId, servicios: serviciosIds } = useLocalSearchParams();
  
  const [persona, setPersona] = useState<Persona | null>(null);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [formaPago, setFormaPago] = useState<FormaPago | null>(null);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const ids = JSON.parse(serviciosIds as string);
      
      // Cargar persona
      const personaRes = await api.get(`/Persona/Obtener/${personaId}`);
      setPersona(personaRes.data);

      // Cargar todos los servicios y filtrar los seleccionados
      const serviciosRes = await api.get('/Servicio/Obtener');
      const serviciosSeleccionados = serviciosRes.data.filter((s: Servicio) => 
        ids.includes(s.id.toString())
      );
      setServicios(serviciosSeleccionados);
    } catch (error) {
      logger.error('Error al cargar datos:', error);
      showError('No se pudieron cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const confirmar = async () => {
    if (!formaPago) {
      Alert.alert('Falta seleccionar', 'Debes seleccionar una forma de pago');
      return;
    }

    setGuardando(true);
    try {
      const esRol01 = usuario?.rol === '01' || usuario?.rol === '1';

      const registros = servicios.map((servicio) => ({
        personaId: parseInt(personaId as string),
        servicioId: servicio.id,
        confirmado: esRol01,
        FormaPago: formaPago,
      }));

      await api.post('/RegistroServicio/Guardar', registros);
      showSuccess('Servicios registrados correctamente');
      router.replace('/(tabs)/registroServicio');
    } catch (error) {
      logger.error('Error al guardar registros:', error);
      showError('No se pudieron guardar los servicios');
    } finally {
      setGuardando(false);
    }
  };

  if (loading) {
    return <LoadingView />;
  }

  const total = servicios.reduce((sum, s) => sum + s.precio, 0);

  const volverAServicios = () => {
    router.back();
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <BackButton onPress={volverAServicios} color="#2d3436" />
        <Text style={styles.title}>Resumen del registro</Text>
      </View>

      {/* Layout en dos columnas principales */}
      <View style={styles.mainRow}>
        {/* Columna izquierda: Empleado, Total, Forma de Pago, Botón */}
        <View style={styles.leftColumn}>
          {/* Información de la persona */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>👤 Empleado</Text>
            <View style={styles.card}>
              <Text style={styles.infoText}>
                {persona?.nombre} {persona?.apellido}
              </Text>
            </View>
          </View>

          {/* Total */}
          <View style={styles.totalSection}>
            <Text style={styles.totalLabel}>Total a pagar</Text>
            <Text style={styles.totalMonto}>{formatCurrency(total)}</Text>
          </View>

          {/* Forma de pago */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>💳 Forma de pago</Text>
            
            <View style={styles.formaPagoRow}>
              <TouchableOpacity
                style={[styles.option, formaPago === 'T' && styles.optionSelected]}
                onPress={() => setFormaPago('T')}
              >
                <Text style={styles.optionIcon}>💳</Text>
                <Text style={[styles.optionText, formaPago === 'T' && styles.optionTextSelected]}>
                  Transferencia
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.option, formaPago === 'E' && styles.optionSelected]}
                onPress={() => setFormaPago('E')}
              >
                <Text style={styles.optionIcon}>💵</Text>
                <Text style={[styles.optionText, formaPago === 'E' && styles.optionTextSelected]}>
                  Efectivo
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Botón confirmar */}
          <TouchableOpacity
            style={[styles.button, (!formaPago || guardando) && styles.buttonDisabled]}
            onPress={confirmar}
            disabled={!formaPago || guardando}
          >
            <Text style={styles.buttonText}>
              {guardando ? 'Guardando...' : 'Confirmar registro'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Columna derecha: Servicios */}
        <View style={styles.rightColumn}>
          <Text style={styles.sectionTitle}>💼 Servicios ({servicios.length})</Text>
          <ScrollView style={styles.serviciosScroll} nestedScrollEnabled>
            {servicios.map((servicio) => (
              <View key={servicio.id} style={styles.servicioItem}>
                <Text style={styles.servicioNombre} numberOfLines={2}>{servicio.nombre}</Text>
                <Text style={styles.servicioValor}>{formatCurrency(servicio.precio)}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: COLORS.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
    flex: 1,
  },
  section: {
    marginBottom: 16,
  },
  mainRow: {
    flexDirection: 'row',
    gap: 16,
    flex: 1,
  },
  leftColumn: {
    flex: 1,
  },
  rightColumn: {
    flex: 1,
  },
  serviciosScroll: {
    maxHeight: 500,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  card: {
    backgroundColor: COLORS.cardBackground,
    padding: 16,
    borderRadius: 12,
  },
  infoText: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '500',
  },
  servicioItem: {
    backgroundColor: COLORS.cardBackground,
    padding: 10,
    borderRadius: 8,
    marginBottom: 6,
  },
  servicioNombre: {
    fontSize: 13,
    color: COLORS.text,
    marginBottom: 4,
  },
  servicioValor: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  totalSection: {
    backgroundColor: '#e8f8f5',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: COLORS.primary + '33',
  },
  totalLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  totalMonto: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  formaPagoRow: {
    flexDirection: 'row',
    gap: 10,
  },
  option: {
    flex: 1,
    backgroundColor: COLORS.cardBackground,
    padding: 12,
    borderRadius: 10,
    flexDirection: 'column',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionSelected: {
    borderColor: COLORS.primary,
  },
  optionIcon: {
    fontSize: 32,
    marginBottom: 6,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
  },
  optionTextSelected: {
    color: COLORS.primary,
  },
  button: {
    backgroundColor: COLORS.primary,
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: COLORS.textSecondary,
    opacity: 0.5,
  },
  buttonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
});
