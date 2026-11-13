import KeyboardAware from '@/components/KeyboardAware';
import { AppText, Badge, Button, Card, Divider, Input, LoadingState, SectionHeader } from '@/components/ds';
import { CampoMoneda } from '@/components/registro/CampoMoneda';
import { EncabezadoPaso } from '@/components/registro/EncabezadoPaso';
import { OpcionFormaPago } from '@/components/registro/OpcionFormaPago';
import { SelectorEvidencias } from '@/components/registro/SelectorEvidencias';
import { useSeleccionArchivos } from '@/components/registro/useSeleccionArchivos';
import { useAuth } from '@/context/authContext';
import { SPACING, useEstilos, useTheme, type Tema } from '@/theme';
import { formatCurrency } from '@/utils/formatters';
import { logger } from '@/utils/logger';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, ScrollView, View } from 'react-native';
import { api, API_URL } from '../../api/api';
import { getDemoMode } from '../../api/demoApi';

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
  const estilos = useEstilos(crearEstilos);
  const { tema } = useTheme();

  const [persona, setPersona] = useState<Persona | null>(null);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [formaPago, setFormaPago] = useState<FormaPago | null>(null);
  const [propina, setPropina] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const {
    archivos: archivosSeleccionados,
    tomarFoto,
    seleccionarImagen,
    seleccionarDocumento,
    eliminarArchivo,
  } = useSeleccionArchivos();
  const [subiendoEvidencias, setSubiendoEvidencias] = useState(false);

  useEffect(() => {
    cargarDatos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cargarDatos = async () => {
    try {
      const ids = JSON.parse(serviciosIds as string);

      // Cargar persona
      const personaRes = await api.get(`/Persona/Obtener/${personaId}`);
      setPersona(personaRes.data);

      // Cargar todos los servicios y filtrar los seleccionados
      const serviciosRes = await api.get('/Servicio/Obtener');
      const serviciosSeleccionados = serviciosRes.data.filter((s: Servicio) => ids.includes(s.id.toString()));
      setServicios(serviciosSeleccionados);
    } catch (error) {
      logger.error('Error al cargar datos:', error);
      Alert.alert('Error', 'No se pudieron cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const subirEvidencias = async (registrosIds: number[]) => {
    if (archivosSeleccionados.length === 0) {
      return;
    }

    // Validar que tengamos IDs válidos
    if (!registrosIds || registrosIds.length === 0) {
      logger.warn('No hay IDs de registros para subir evidencias');
      return;
    }

    // En modo demo no subimos archivos reales al servidor.
    if (await getDemoMode()) {
      logger.log('[DEMO] Subida de evidencias omitida');
      return;
    }

    setSubiendoEvidencias(true);
    try {
      // Token y empresaId que normalmente agrega el interceptor de axios.
      // Como en móvil subimos con FileSystem.uploadAsync (fuera de axios),
      // los adjuntamos manualmente.
      const [token, empresaId] = await Promise.all([AsyncStorage.getItem('token'), AsyncStorage.getItem('empresaId')]);

      // Subir cada evidencia para cada registro
      for (const registroId of registrosIds) {
        // Validar que el ID sea válido
        if (!registroId || isNaN(registroId)) {
          logger.warn('ID de registro inválido:', registroId);
          continue;
        }

        for (const archivo of archivosSeleccionados) {
          // Determinar el tipo MIME correcto basado en la extensión si no está presente
          let mimeType = archivo.type;
          if (!mimeType || mimeType === 'application/octet-stream') {
            const extension = archivo.name.split('.').pop()?.toLowerCase();
            if (extension === 'jpg' || extension === 'jpeg') {
              mimeType = 'image/jpeg';
            } else if (extension === 'png') {
              mimeType = 'image/png';
            } else if (extension === 'gif') {
              mimeType = 'image/gif';
            } else if (extension === 'webp') {
              mimeType = 'image/webp';
            } else if (extension === 'pdf') {
              mimeType = 'application/pdf';
            } else {
              mimeType = 'image/jpeg'; // Default para imágenes
            }
          }

          if (Platform.OS === 'web' || archivo.uri.startsWith('blob:')) {
            // En Web: convertir blob a File y enviar con axios
            const formData = new FormData();
            formData.append('registroServicioId', registroId.toString());
            try {
              const response = await fetch(archivo.uri);
              const blob = await response.blob();
              const file = new File([blob], archivo.name, { type: mimeType });
              formData.append('archivo', file);
            } catch (error) {
              logger.error('Error al convertir blob:', error);
              throw new Error('No se pudo procesar el archivo para web');
            }
            const response = await api.post('/Evidencia/SubirEvidencia', formData);
            logger.log('Evidencia subida exitosamente (web):', response.data);
          } else {
            // En Mobile (iOS/Android): subir directo desde disco con
            // FileSystem.uploadAsync. Evita el bug de axios + FormData
            // multipart en Android (boundary inestable / body vacío).
            const headers: Record<string, string> = {};
            if (token) headers['Authorization'] = `Bearer ${token}`;
            if (empresaId) headers['empresaId'] = empresaId;

            logger.log('Subiendo evidencia (mobile):', archivo.uri, mimeType);

            const uploadResult = await FileSystem.uploadAsync(`${API_URL}/Evidencia/SubirEvidencia`, archivo.uri, {
              httpMethod: 'POST',
              uploadType: FileSystem.FileSystemUploadType.MULTIPART,
              fieldName: 'archivo',
              mimeType,
              parameters: { registroServicioId: registroId.toString() },
              headers,
            });

            if (uploadResult.status < 200 || uploadResult.status >= 300) {
              logger.error('Fallo al subir evidencia:', uploadResult.status, uploadResult.body);
              throw new Error(`Error ${uploadResult.status} al subir la evidencia`);
            }

            logger.log('Evidencia subida exitosamente (mobile):', uploadResult.body);
          }
        }
      }
    } catch (error) {
      logger.error('Error al subir evidencias:', error);
      throw error;
    } finally {
      setSubiendoEvidencias(false);
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
      const propinaValor = propina ? parseFloat(propina) : 0;
      const observacionesValor = observaciones.trim();

      // La propina pertenece a la visita completa: se adjunta solo al primer
      // servicio para no multiplicarla entre los servicios seleccionados.
      const registros = servicios.map((servicio, index) => ({
        personaId: parseInt(personaId as string),
        servicioId: servicio.id,
        confirmado: esRol01,
        FormaPago: formaPago,
        propina: index === 0 ? propinaValor : 0,
        observaciones: observacionesValor,
      }));

      // Guardar los registros
      const response = await api.post('/RegistroServicio/Guardar', registros);

      logger.log('Respuesta del backend:', response.data);

      // Si hay evidencias, subirlas
      if (archivosSeleccionados.length > 0) {
        try {
          let registrosIds: number[] = [];

          // Verificar si la respuesta contiene los IDs
          if (Array.isArray(response.data)) {
            registrosIds = response.data
              .map((r: any) => r.id || r.Id || r.ID)
              .filter((id: any) => id !== undefined && id !== null);
          } else if (response.data?.registrosIds && Array.isArray(response.data.registrosIds)) {
            registrosIds = response.data.registrosIds;
          } else if (response.data?.id || response.data?.Id || response.data?.ID) {
            registrosIds = [response.data.id || response.data.Id || response.data.ID];
          }

          // Si no hay IDs en la respuesta, consultar los últimos registros de esta persona
          if (registrosIds.length === 0) {
            logger.log('Backend no retornó IDs, consultando registros recientes...');

            // Obtener todos los registros de la persona
            const registrosResponse = await api.get(`/RegistroServicio/ObtenerPorPersona/${personaId}`);

            if (registrosResponse.data && Array.isArray(registrosResponse.data)) {
              // Filtrar los registros que coincidan con los servicios que acabamos de guardar
              const servicioIds = servicios.map((s) => s.id);
              const registrosRecientes = registrosResponse.data
                .filter((r: any) => servicioIds.includes(r.servicioId))
                // Ordenar por fecha descendente y tomar los últimos N registros
                .sort((a: any, b: any) => {
                  const dateA = new Date(a.fechaServicio || a.fechaCreacion || 0).getTime();
                  const dateB = new Date(b.fechaServicio || b.fechaCreacion || 0).getTime();
                  return dateB - dateA;
                })
                .slice(0, servicios.length);

              registrosIds = registrosRecientes.map((r: any) => r.id || r.Id).filter(Boolean);
              logger.log('IDs obtenidos de consulta:', registrosIds);
            }
          }

          if (registrosIds.length > 0) {
            logger.log('Subiendo evidencias para', registrosIds.length, 'registros');
            await subirEvidencias(registrosIds);
          } else {
            logger.warn('No se pudieron obtener los IDs de los registros');
            Alert.alert(
              'Advertencia',
              'Servicios registrados correctamente, pero no se pudieron subir las evidencias automáticamente.'
            );
          }
        } catch (errorEvidencias) {
          logger.error('Error al procesar evidencias:', errorEvidencias);
          Alert.alert('Advertencia', 'Servicios registrados correctamente, pero hubo un error al subir las evidencias.');
        }
      }

      Alert.alert(
        'Éxito',
        'Servicios registrados correctamente' + (archivosSeleccionados.length > 0 && response.data ? ' con evidencias' : '')
      );
      router.replace('/(tabs)/registroServicio');
    } catch (error) {
      logger.error('Error al guardar registros:', error);
      Alert.alert('Error', 'No se pudieron guardar los servicios');
    } finally {
      setGuardando(false);
    }
  };

  if (loading) {
    return <LoadingState />;
  }

  const total = servicios.reduce((sum, s) => sum + s.precio, 0);

  const volverAServicios = () => {
    router.back();
  };

  const opcional = <Badge label="Opcional" tone="neutral" dot={false} size="sm" />;
  const procesando = guardando || subiendoEvidencias;

  return (
    <KeyboardAware>
      <ScrollView style={estilos.pantalla} contentContainerStyle={estilos.contenido} keyboardShouldPersistTaps="handled">
        <EncabezadoPaso title="Resumen del registro" onBack={volverAServicios} />

        {/* Empleado (informativo) + total destacado */}
        <View style={estilos.filaResumen}>
          <Card style={estilos.bloqueResumen}>
            <AppText variante="nota" tono="suave">
              Empleado
            </AppText>
            <AppText variante="etiqueta" style={estilos.valorResumen} numberOfLines={2}>
              {persona?.nombre} {persona?.apellido}
            </AppText>
          </Card>
          <Card variant="tinted" style={estilos.bloqueResumen}>
            <AppText variante="nota" tono="primario">
              Total a pagar
            </AppText>
            <AppText variante="numero" tono="primario" style={estilos.valorResumen} numberOfLines={1} adjustsFontSizeToFit>
              {formatCurrency(total)}
            </AppText>
          </Card>
        </View>

        <Card style={estilos.seccion}>
          <SectionHeader title={`Servicios (${servicios.length})`} icon="briefcase-outline" />
          {servicios.map((servicio, index) => (
            <View key={servicio.id}>
              {index > 0 ? <Divider /> : null}
              <View style={estilos.servicio}>
                <AppText style={estilos.servicioNombre} numberOfLines={2}>
                  {servicio.nombre}
                </AppText>
                <AppText variante="etiqueta" tono="primario">
                  {formatCurrency(servicio.precio)}
                </AppText>
              </View>
            </View>
          ))}
        </Card>

        <Card style={estilos.seccion}>
          <SectionHeader title="Forma de pago" icon="card-outline" />
          <View style={estilos.opciones}>
            <OpcionFormaPago
              label="Transferencia"
              icon="swap-horizontal-outline"
              selected={formaPago === 'T'}
              onPress={() => setFormaPago('T')}
            />
            <OpcionFormaPago label="Efectivo" icon="cash-outline" selected={formaPago === 'E'} onPress={() => setFormaPago('E')} />
          </View>
        </Card>

        <Card style={estilos.seccion}>
          <SectionHeader title="Propina" icon="gift-outline" right={opcional} />
          <CampoMoneda
            value={propina}
            onChangeValue={setPropina}
            placeholder="$0"
            leftIcon="cash-outline"
            helper="La propina pertenece 100% al trabajador."
          />
        </Card>

        <Card style={estilos.seccion}>
          <SectionHeader title="Observaciones" icon="document-text-outline" right={opcional} />
          <Input
            value={observaciones}
            onChangeText={setObservaciones}
            placeholder="Ej: Cliente habitual, atención especial..."
            multiline
            numberOfLines={3}
            maxLength={256}
            containerStyle={estilos.sinMargen}
          />
        </Card>

        <Card style={estilos.seccion}>
          <SectionHeader title="Evidencias" icon="image-outline" right={opcional} />
          <SelectorEvidencias
            archivos={archivosSeleccionados}
            onCamara={tomarFoto}
            onGaleria={seleccionarImagen}
            onArchivo={seleccionarDocumento}
            onQuitar={eliminarArchivo}
          />
        </Card>

        <Button
          title={procesando ? (subiendoEvidencias ? 'Subiendo evidencias...' : 'Guardando...') : 'Confirmar registro'}
          icon={
            procesando ? <ActivityIndicator size="small" color={tema.colores.textoDeshabilitado} /> : 'checkmark'
          }
          size="lg"
          onPress={confirmar}
          disabled={!formaPago || guardando}
          style={estilos.confirmar}
        />
      </ScrollView>
    </KeyboardAware>
  );
}

const crearEstilos = (t: Tema) => ({
  pantalla: { flex: 1, backgroundColor: t.colores.fondo },
  contenido: { padding: SPACING.lg, paddingBottom: SPACING.huge },
  filaResumen: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: SPACING.md, marginBottom: SPACING.lg },
  bloqueResumen: { flexGrow: 1, flexBasis: 140, minWidth: 0, marginBottom: 0 },
  valorResumen: { marginTop: SPACING.xs },
  seccion: { marginBottom: SPACING.lg },
  servicio: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  servicioNombre: { flex: 1, minWidth: 0 },
  opciones: { flexDirection: 'row' as const, gap: SPACING.md },
  sinMargen: { marginBottom: 0 },
  confirmar: { marginTop: SPACING.sm },
});
