import { Button, Input, Select, ToggleRow } from '@/components/ds';
import KeyboardAware from '@/components/KeyboardAware';
import { SPACING, useEstilos, type Tema } from '@/theme';
import { logger } from '@/utils/logger';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView } from 'react-native';
import { api } from '../../api/api';

const crearEstilos = (t: Tema) => ({
  contenedor: { padding: SPACING.lg, backgroundColor: t.colores.fondo, flexGrow: 1 },
});

export default function CrearConfiguracion() {
  const router = useRouter();
  const estilos = useEstilos(crearEstilos);

  const [configuracion, setConfiguracion] = useState({
    servicioId: '',
    porcentajeTrabajador: '',
    porcentajeEmpresa: '',
    estado: true,
  });

  const [errores, setErrores] =
    useState<Partial<Record<keyof typeof configuracion, string>>>({});
  const [servicios, setServicios] =
    useState<{ id: number; nombre: string }[]>([]);
  const [configuracionesExistentes, setConfiguracionesExistentes] = useState<number[]>([]);

  /* ===================== CARGAR SERVICIOS Y CONFIGURACIONES ===================== */
  useEffect(() => {
    // Cargar servicios
    api
      .get('/Servicio/Obtener')
      .then((res) => setServicios(res.data))
      .catch(() => {
        Alert.alert('Error', 'No se pudieron cargar los servicios');
      });

    // Cargar configuraciones existentes
    api
      .get('/ConfiguracionServicio/Obtener')
      .then((res) => {
        const serviciosConfigurados = res.data.map((config: any) => config.servicioId);
        setConfiguracionesExistentes(serviciosConfigurados);
      })
      .catch(() => {
        logger.error('No se pudieron cargar las configuraciones existentes');
      });
  }, []);

  /* ===================== HANDLER ===================== */
  const handleChange = (campo: keyof typeof configuracion, valor: string) => {
    setConfiguracion((prev) => ({ ...prev, [campo]: valor }));
    setErrores((prev) => ({ ...prev, [campo]: '' }));
  };

  const setPorcentajeEmpresa = (valor: string) => {
    const numero = parseFloat(valor);
    const empresa = isNaN(numero) ? '' : Math.min(100, Math.max(0, numero)).toString();
    const trabajador = empresa === '' ? '' : (100 - parseFloat(empresa)).toString();
    setConfiguracion((prev) => ({
      ...prev,
      porcentajeEmpresa: valor,
      porcentajeTrabajador: trabajador,
    }));
    setErrores((prev) => ({ ...prev, porcentajeEmpresa: '', porcentajeTrabajador: '' }));
  };

  /* ===================== GUARDAR ===================== */
  const guardar = async () => {
    const pt = parseFloat(configuracion.porcentajeTrabajador);
    const pe = parseFloat(configuracion.porcentajeEmpresa);
    const servicioId = parseInt(configuracion.servicioId);

    if (!configuracion.servicioId) {
      setErrores((prev) => ({ ...prev, servicioId: 'Seleccione un servicio' }));
      Alert.alert('Error', 'Seleccione un servicio');
      return;
    }

    // Validar si el servicio ya está configurado
    if (configuracionesExistentes.includes(servicioId)) {
      Alert.alert('Error', 'Este servicio ya está configurado. Edítelo desde la lista de configuraciones.');
      return;
    }

    if (isNaN(pt) || isNaN(pe)) {
      Alert.alert('Error', 'Porcentajes inválidos');
      return;
    }

    if (pt + pe !== 100) {
      Alert.alert('Error', 'La suma de porcentajes debe ser 100%');
      return;
    }

    try {
      await api.post('/ConfiguracionServicio/Crear', {
        servicioId,
        porcentajeTrabajador: pt,
        porcentajeEmpresa: pe,
        estado: configuracion.estado,
      });

      Alert.alert('Éxito', 'Configuración creada');
      router.back();
    } catch (error) {
      logger.error('Error al guardar', error);
      Alert.alert('Error', 'No se pudo guardar la configuración');
    }
  };

  // Filtrar servicios que no están configurados
  const serviciosDisponibles = servicios.filter(
    (s) => !configuracionesExistentes.includes(s.id)
  );

  return (
    <KeyboardAware>
      <ScrollView contentContainerStyle={estilos.contenedor} keyboardShouldPersistTaps="handled">
        <Select
          label="Servicio"
          placeholder={
            serviciosDisponibles.length === 0 && servicios.length > 0
              ? 'Todos los servicios ya están configurados'
              : 'Seleccione un servicio'
          }
          value={configuracion.servicioId || null}
          onChange={(v) => handleChange('servicioId', v)}
          options={serviciosDisponibles.map((s) => ({ value: s.id.toString(), label: s.nombre }))}
          error={errores.servicioId || undefined}
        />

        <Input
          label="Porcentaje empresa"
          value={configuracion.porcentajeEmpresa}
          onChangeText={setPorcentajeEmpresa}
          keyboardType="numeric"
          leftIcon="pie-chart-outline"
          placeholder="Ej. 60"
        />

        <Input
          label="Porcentaje trabajador"
          value={configuracion.porcentajeTrabajador}
          editable={false}
          keyboardType="numeric"
          helper="Se calcula automáticamente"
        />

        <ToggleRow
          label="Estado de la configuración"
          description={configuracion.estado ? 'Activa' : 'Inactiva'}
          value={configuracion.estado}
          onValueChange={(value) => setConfiguracion((prev) => ({ ...prev, estado: value }))}
        />

        <Button title="Guardar" onPress={guardar} />
      </ScrollView>
    </KeyboardAware>
  );
}
