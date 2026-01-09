import { useAuth } from '@/context/authContext';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { api } from '../../api/api';

type ConfiguracionGeneral = {
  periodicidad: string;
  valorPeriodicidad: number;
  empresaId?: number | null;
};

const webSelectStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 10px',
  borderRadius: 6,
  border: '1px solid #ced4da',
  backgroundColor: '#fff',
  fontSize: 16,
  color: '#212529',
};

export default function ConfiguracionGeneral() {
  const router = useRouter();
  const { usuario } = useAuth();
  const empresaId = usuario?.empresaId;

  const [config, setConfig] = useState<ConfiguracionGeneral>({
    periodicidad: '',
    valorPeriodicidad: 0,
    empresaId: null,
  });
  const [originalPeriodicidad, setOriginalPeriodicidad] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const cargar = async () => {
      if (!empresaId) return;
      setLoading(true);
      try {
        const res = await api.get(`/ConfiguracionGeneral/Obtener/${empresaId}`);
          if (res?.data) {
          const toCode = (p: any) => {
            if (!p) return '';
            const s = String(p).trim();
            if (/^[MQSD]$/i.test(s)) return s.toUpperCase();
            const lower = s.toLowerCase();
            if (lower.startsWith('men')) return 'M';
            if (lower.startsWith('qui') || lower.startsWith('quin')) return 'Q';
            if (lower.startsWith('sem')) return 'S';
            if (lower.startsWith('dia')) return 'D';
            return s.charAt(0).toUpperCase();
          };

          setConfig({
            periodicidad: toCode(res.data.periodicidad ?? ''),
            valorPeriodicidad: res.data.valorPeriodicidad ?? 0,
            empresaId: res.data.empresaId ?? empresaId,
          });
          // guardar la periodicidad original para enviarla al actualizar
          setOriginalPeriodicidad(toCode(res.data.periodicidad ?? ''));
        }
      } catch (e) {
        // si no existe, lo dejamos en blanco (no mostrar error)
        console.warn('No se encontró configuración para la empresa', e);
      } finally {
        setLoading(false);
      }
    };

    cargar();
  }, [empresaId]);

  // Inyectar Bootstrap en web para mejorar apariencia
  // Bootstrap ya se carga globalmente en el proyecto; no inyectamos aquí.

  const guardar = async () => {
    if (!empresaId) {
      Alert.alert('Error', 'Empresa no definida');
      return;
    }

    if (!config.periodicidad) {
      Alert.alert('Error', 'Ingrese periodicidad');
      return;
    }

    setLoading(true);
    try {
      if (config.empresaId) {
        // actualizar
        // enviar la periodicidad original como query param
        const qs = originalPeriodicidad ? `?periodicidadOriginal=${encodeURIComponent(originalPeriodicidad)}` : '';
        await api.put(`/ConfiguracionGeneral/Actualizar/${empresaId}${qs}`, {
          Periodicidad: config.periodicidad, // ahora enviamos M/Q/S/D (nueva)
          ValorPeriodicidad: Number(config.valorPeriodicidad),
          EmpresaId: empresaId,
        });
        Alert.alert('Éxito', 'Configuración actualizada');
      } else {
        // crear
        await api.post('/ConfiguracionGeneral/Crear', {
          Periodicidad: config.periodicidad, // M/Q/S/D
          ValorPeriodicidad: Number(config.valorPeriodicidad),
        });
        Alert.alert('Éxito', 'Configuración creada');
      }
      router.back();
    } catch (e: any) {
      console.error('Error al guardar configuración', e);
      Alert.alert('Error', e?.response?.data || 'No se pudo guardar la configuración');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.field}>
        <Text style={styles.label}>Periodicidad</Text>

        {Platform.OS === 'web' ? (
          <>
            <select
              className="form-select"
              value={config.periodicidad}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setConfig((p) => ({ ...p, periodicidad: e.target.value }))
              }
              style={webSelectStyle}
            >
              <option value="">Seleccione periodicidad</option>
              <option value="M">Mensual (30 días)</option>
              <option value="Q">Quincenal (15 días)</option>
              <option value="S">Semanal (7 días)</option>
              <option value="D">Dias (personalizado)</option>
            </select>
            {config.periodicidad && (
              <Text style={styles.helperText}>
                {config.periodicidad === 'M' && '📅 Liquidación cada 30 días'}
                {config.periodicidad === 'Q' && '📅 Liquidación cada 15 días'}
                {config.periodicidad === 'S' && '📅 Liquidación cada 7 días'}
                {config.periodicidad === 'D' && '📅 Liquidación personalizada'}
              </Text>
            )}
          </>
        ) : (
          <>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={config.periodicidad}
                onValueChange={(v) => setConfig((p) => ({ ...p, periodicidad: v }))}
              >
                <Picker.Item label="Seleccione periodicidad" value="" />
                <Picker.Item label="Mensual (30 días)" value="M" />
                <Picker.Item label="Quincenal (15 días)" value="Q" />
                <Picker.Item label="Semanal (7 días)" value="S" />
                <Picker.Item label="Dias (personalizado)" value="D" />
              </Picker>
            </View>
            {config.periodicidad && (
              <Text style={styles.helperText}>
                {config.periodicidad === 'M' && '📅 Liquidación cada 30 días'}
                {config.periodicidad === 'Q' && '📅 Liquidación cada 15 días'}
                {config.periodicidad === 'S' && '📅 Liquidación cada 7 días'}
                {config.periodicidad === 'D' && '📅 Liquidación personalizada'}
              </Text>
            )}
          </>
        )}
      </View>

      {config.periodicidad === 'D' && (
        <View style={styles.field}>
          <Text style={styles.label}>Valor Periodicidad (días)</Text>
          {Platform.OS === 'web' ? (
            <TextInput
              value={String(config.valorPeriodicidad ?? '')}
              onChangeText={(t) => setConfig((p) => ({ ...p, valorPeriodicidad: Number(t) || 0 }))}
              keyboardType="numeric"
              style={styles.input}
              placeholder="Número de días"
            />
          ) : (
            <TextInput
              value={String(config.valorPeriodicidad ?? '')}
              onChangeText={(t) => setConfig((p) => ({ ...p, valorPeriodicidad: Number(t) || 0 }))}
              keyboardType="numeric"
              style={styles.input}
              placeholder="Número de días"
            />
          )}
        </View>
      )}

      {Platform.OS === 'web' ? (
        <div style={{ marginTop: 10 }}>
          <button className="btn btn-primary w-100" onClick={guardar} disabled={loading}>
            Guardar
          </button>
        </div>
      ) : (
        <TouchableOpacity style={styles.button} onPress={guardar} disabled={loading}>
          <Text style={styles.buttonText}>Guardar</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#f2f2f2', flexGrow: 1 },
  field: { marginBottom: 16 },
  label: { fontWeight: '600', marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 6,
    padding: 12,
    backgroundColor: '#fff',
  },
  helperText: {
    fontSize: 13,
    color: '#0984e3',
    marginTop: 6,
    fontStyle: 'italic',
  },
  button: { backgroundColor: '#00b894', padding: 14, borderRadius: 8, alignItems: 'center', width: '100%' },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  pickerWrapper: { borderWidth: 1, borderColor: '#ced4da', borderRadius: 6, overflow: 'hidden' },
});
