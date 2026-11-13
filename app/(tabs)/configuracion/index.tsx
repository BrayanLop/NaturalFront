import { AppText, Button, Card, ChipGroup, Icon, Input, SectionHeader, Select, type IconName } from '@/components/ds';
import { useAuth } from '@/context/authContext';
import { SPACING, useEstilos, useTheme, type Preferencia, type Tema } from '@/theme';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';
import { api } from '../../api/api';
import { logger } from '@/utils/logger';

type ConfiguracionGeneral = {
  periodicidad: string;
  valorPeriodicidad: number;
  empresaId?: number | null;
};

const OPCIONES_PERIODICIDAD = [
  { value: 'M', label: 'Mensual (30 días)' },
  { value: 'Q', label: 'Quincenal (15 días)' },
  { value: 'S', label: 'Semanal (7 días)' },
  { value: 'D', label: 'Días (personalizado)' },
];

const TEXTO_PERIODICIDAD: Record<string, string> = {
  M: 'Liquidación cada 30 días',
  Q: 'Liquidación cada 15 días',
  S: 'Liquidación cada 7 días',
  D: 'Liquidación personalizada',
};

const OPCIONES_APARIENCIA: { key: Preferencia; label: string; icon: IconName }[] = [
  { key: 'sistema', label: 'Sistema', icon: 'phone-portrait-outline' },
  { key: 'claro', label: 'Claro', icon: 'sunny-outline' },
  { key: 'oscuro', label: 'Oscuro', icon: 'moon-outline' },
];

const crearEstilos = (t: Tema) => ({
  contenedor: { padding: SPACING.lg, paddingBottom: SPACING.huge, backgroundColor: t.colores.fondo, flexGrow: 1 },
  pista: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: SPACING.sm,
    marginTop: -SPACING.sm,
    marginBottom: SPACING.lg,
  },
  pistaTexto: { flex: 1, minWidth: 0 },
});

export default function ConfiguracionGeneral() {
  const estilos = useEstilos(crearEstilos);
  const { tema, preferencia, setPreferencia } = useTheme();
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
        logger.warn('No se encontró configuración para la empresa', e);
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
      logger.error('Error al guardar configuración', e);
      Alert.alert('Error', e?.response?.data || 'No se pudo guardar la configuración');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={estilos.contenedor} keyboardShouldPersistTaps="handled">
      <Card>
        <SectionHeader
          title="Liquidación"
          icon="calendar-outline"
          ayuda="Define cada cuánto tiempo se liquidan los pagos de los trabajadores."
        />
        <Select
          label="Periodicidad"
          placeholder="Seleccione periodicidad"
          value={config.periodicidad || null}
          options={OPCIONES_PERIODICIDAD}
          onChange={(v) => setConfig((p) => ({ ...p, periodicidad: v }))}
        />
        {config.periodicidad && TEXTO_PERIODICIDAD[config.periodicidad] ? (
          <View style={estilos.pista}>
            <Icon name="information-circle-outline" size={18} color={tema.colores.infoTexto} />
            <AppText variante="nota" tono="suave" style={estilos.pistaTexto}>
              {TEXTO_PERIODICIDAD[config.periodicidad]}
            </AppText>
          </View>
        ) : null}

        {config.periodicidad === 'D' && (
          <Input
            label="Valor periodicidad (días)"
            value={String(config.valorPeriodicidad ?? '')}
            onChangeText={(t) => setConfig((p) => ({ ...p, valorPeriodicidad: Number(t) || 0 }))}
            keyboardType="numeric"
            placeholder="Número de días"
            leftIcon="calendar-outline"
          />
        )}

        <Button title="Guardar" icon="checkmark" onPress={guardar} loading={loading} />
      </Card>

      <Card>
        <SectionHeader
          title="Apariencia"
          icon="color-palette-outline"
          ayuda="Elige si la app sigue el tema de tu dispositivo o usa siempre claro u oscuro."
        />
        <ChipGroup
          value={preferencia}
          onChange={(k) => setPreferencia(k as Preferencia)}
          options={OPCIONES_APARIENCIA}
        />
      </Card>
    </ScrollView>
  );
}
