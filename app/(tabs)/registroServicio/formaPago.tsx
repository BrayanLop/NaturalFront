import BackButton from '@/components/BackButton';
import LoadingView from '@/components/LoadingView';
import { COLORS } from '@/constants/theme';
import { useAuth } from '@/context/authContext';
import { formatCurrency } from '@/utils/formatters';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { MaskedTextInput } from 'react-native-mask-text';
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

interface ArchivoSeleccionado {
  uri: string;
  name: string;
  type: string;
  size?: number;
}

export default function ResumenYFormaPago() {
  const router = useRouter();
  const { usuario } = useAuth();
  const { persona: personaId, servicios: serviciosIds } = useLocalSearchParams();
  
  const [persona, setPersona] = useState<Persona | null>(null);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [formaPago, setFormaPago] = useState<FormaPago | null>(null);
  const [propina, setPropina] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [archivosSeleccionados, setArchivosSeleccionados] = useState<ArchivoSeleccionado[]>([]);
  const [subiendoEvidencias, setSubiendoEvidencias] = useState(false);

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
      console.error('Error al cargar datos:', error);
      Alert.alert('Error', 'No se pudieron cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const tomarFoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso requerido', 'Necesitamos permisos para usar la cámara');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const archivo: ArchivoSeleccionado = {
          uri: asset.uri,
          name: asset.fileName || `foto_${Date.now()}.jpg`,
          type: asset.mimeType || 'image/jpeg',
          size: asset.fileSize,
        };
        console.log('Foto tomada:', archivo);
        setArchivosSeleccionados(prev => [...prev, archivo]);
      }
    } catch (error) {
      console.error('Error al tomar foto:', error);
      Alert.alert('Error', 'No se pudo tomar la foto');
    }
  };

  const seleccionarImagen = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso requerido', 'Necesitamos permisos para acceder a tus fotos');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        let finalUri = asset.uri;
        
        // En Android (content://) e iOS (ph://), copiar a cache para que funcione con FormData
        if (Platform.OS !== 'web' && (asset.uri.startsWith('content://') || asset.uri.startsWith('ph://'))) {
          const fileName = asset.fileName || `imagen_${Date.now()}.jpg`;
          const cacheUri = `${FileSystem.cacheDirectory}${fileName}`;
          
          try {
            await FileSystem.copyAsync({
              from: asset.uri,
              to: cacheUri,
            });
            finalUri = cacheUri;
            console.log('Imagen copiada a cache:', cacheUri);
          } catch (copyError) {
            console.error('Error al copiar imagen a cache:', copyError);
            // Si falla la copia, intentar con la URI original
          }
        }
        
        const archivo: ArchivoSeleccionado = {
          uri: finalUri,
          name: asset.fileName || `imagen_${Date.now()}.jpg`,
          type: asset.mimeType || 'image/jpeg',
          size: asset.fileSize,
        };
        console.log('Imagen seleccionada:', archivo);
        setArchivosSeleccionados(prev => [...prev, archivo]);
      }
    } catch (error) {
      console.error('Error al seleccionar imagen:', error);
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
    }
  };

  const seleccionarDocumento = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const archivo: ArchivoSeleccionado = {
          uri: asset.uri,
          name: asset.name,
          type: asset.mimeType || 'application/octet-stream',
          size: asset.size,
        };
        console.log('Documento seleccionado:', archivo);
        setArchivosSeleccionados(prev => [...prev, archivo]);
      }
    } catch (error) {
      console.error('Error al seleccionar documento:', error);
      Alert.alert('Error', 'No se pudo seleccionar el documento');
    }
  };

  const eliminarArchivo = (index: number) => {
    setArchivosSeleccionados(prev => prev.filter((_, i) => i !== index));
  };

  const subirEvidencias = async (registrosIds: number[]) => {
    if (archivosSeleccionados.length === 0) {
      return;
    }

    // Validar que tengamos IDs válidos
    if (!registrosIds || registrosIds.length === 0) {
      console.warn('No hay IDs de registros para subir evidencias');
      return;
    }

    setSubiendoEvidencias(true);
    try {
      // Subir cada evidencia para cada registro
      for (const registroId of registrosIds) {
        // Validar que el ID sea válido
        if (!registroId || isNaN(registroId)) {
          console.warn('ID de registro inválido:', registroId);
          continue;
        }

        for (const archivo of archivosSeleccionados) {
          const formData = new FormData();
          formData.append('registroServicioId', registroId.toString());
          
          console.log('Procesando archivo:', JSON.stringify(archivo, null, 2));
          
          // Manejar diferente según la plataforma
          if (Platform.OS === 'web' || archivo.uri.startsWith('blob:')) {
            // En Web: convertir blob a File
            try {
              const response = await fetch(archivo.uri);
              const blob = await response.blob();
              const file = new File([blob], archivo.name, { type: archivo.type || 'image/jpeg' });
              
              console.log('Archivo convertido para web:', file);
              formData.append('archivo', file);
            } catch (error) {
              console.error('Error al convertir blob:', error);
              throw new Error('No se pudo procesar el archivo para web');
            }
          } else {
            // En Mobile (iOS/Android): usar objeto con uri, name, type
            let fileUri = archivo.uri;
            
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
              } else if (extension === 'heic' || extension === 'heif') {
                mimeType = 'image/heic';
              } else if (extension === 'pdf') {
                mimeType = 'application/pdf';
              } else {
                mimeType = 'image/jpeg'; // Default para imágenes
              }
            }
            
            // En Android: agregar file:// solo si no tiene ningún esquema
            if (Platform.OS === 'android' && !fileUri.startsWith('file://') && !fileUri.startsWith('content://')) {
              fileUri = 'file://' + fileUri;
            }
            
            // En iOS: la URI de DocumentPicker puede necesitar decodificación
            if (Platform.OS === 'ios') {
              // Asegurarse de que la URI esté correctamente formateada
              fileUri = decodeURIComponent(fileUri.replace('file://', '')).startsWith('/') 
                ? fileUri 
                : fileUri;
            }
            
            const fileToUpload: any = {
              uri: fileUri,
              name: archivo.name,
              type: mimeType,
            };
            
            console.log('Archivo para mobile:', JSON.stringify(fileToUpload, null, 2));
            formData.append('archivo', fileToUpload as any);
          }

          console.log('Enviando FormData para registro', registroId);

          // Enviar sin establecer Content-Type - axios lo detectará automáticamente
          const response = await api.post('/Evidencia/SubirEvidencia', formData);
          
          console.log('Evidencia subida exitosamente:', response.data);
        }
      }
    } catch (error) {
      console.error('Error al subir evidencias:', error);
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
      
      console.log('Respuesta del backend:', response.data);
      
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
            console.log('Backend no retornó IDs, consultando registros recientes...');
            
            // Obtener todos los registros de la persona
            const registrosResponse = await api.get(`/RegistroServicio/ObtenerPorPersona/${personaId}`);
            
            if (registrosResponse.data && Array.isArray(registrosResponse.data)) {
              // Filtrar los registros que coincidan con los servicios que acabamos de guardar
              const servicioIds = servicios.map(s => s.id);
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
              console.log('IDs obtenidos de consulta:', registrosIds);
            }
          }
          
          if (registrosIds.length > 0) {
            console.log('Subiendo evidencias para', registrosIds.length, 'registros');
            await subirEvidencias(registrosIds);
          } else {
            console.warn('No se pudieron obtener los IDs de los registros');
            Alert.alert(
              'Advertencia',
              'Servicios registrados correctamente, pero no se pudieron subir las evidencias automáticamente.'
            );
          }
        } catch (errorEvidencias) {
          console.error('Error al procesar evidencias:', errorEvidencias);
          Alert.alert(
            'Advertencia',
            'Servicios registrados correctamente, pero hubo un error al subir las evidencias.'
          );
        }
      }

      Alert.alert('\u00c9xito', 'Servicios registrados correctamente' + 
        (archivosSeleccionados.length > 0 && response.data ? ' con evidencias' : ''));
      router.replace('/(tabs)/registroServicio');
    } catch (error) {
      console.error('Error al guardar registros:', error);
      Alert.alert('Error', 'No se pudieron guardar los servicios');
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

      {/* Fila superior: Empleado + Total */}
      <View style={styles.topRow}>
        <View style={styles.employeeCard}>
          <Text style={styles.cardLabel}>👤 Empleado</Text>
          <Text style={styles.employeeName}>
            {persona?.nombre} {persona?.apellido}
          </Text>
        </View>
        <View style={styles.totalCard}>
          <Text style={styles.cardLabel}>Total a pagar</Text>
          <Text style={styles.totalMonto}>{formatCurrency(total)}</Text>
        </View>
      </View>

      {/* Servicios en grid */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>💼 Servicios ({servicios.length})</Text>
        <View style={styles.serviciosGrid}>
          {servicios.map((servicio) => (
            <View key={servicio.id} style={styles.servicioItem}>
              <Text style={styles.servicioNombre} numberOfLines={2}>{servicio.nombre}</Text>
              <Text style={styles.servicioValor}>{formatCurrency(servicio.precio)}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Forma de pago debajo de servicios */}
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

      {/* Propina (100% del trabajador) */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>💰 Propina (Opcional)</Text>
        <MaskedTextInput
          type="currency"
          options={{
            prefix: '$',
            decimalSeparator: ',',
            groupSeparator: '.',
            precision: 0,
          }}
          value={propina}
          onChangeText={(_, unmasked) => setPropina(unmasked)}
          style={styles.input}
          keyboardType="numeric"
          placeholder="$0"
        />
        <Text style={styles.helperText}>La propina pertenece 100% al trabajador.</Text>
      </View>

      {/* Observaciones */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📝 Observaciones (Opcional)</Text>
        <TextInput
          value={observaciones}
          onChangeText={setObservaciones}
          style={[styles.input, styles.textArea]}
          placeholder="Ej: Cliente habitual, atención especial..."
          multiline
          numberOfLines={3}
          maxLength={256}
        />
      </View>

      {/* Evidencias con todas las opciones */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📎 Evidencias (Opcional)</Text>
        <View style={styles.evidenceOptionsContainer}>
          <TouchableOpacity onPress={tomarFoto} style={styles.iconButton}>
            <MaterialIcons name="photo-camera" size={28} color={COLORS.primary} />
            <Text style={styles.iconButtonLabel}>Cámara</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={seleccionarDocumento} style={styles.iconButton}>
            <MaterialIcons name="attach-file" size={28} color={COLORS.primary} />
            <Text style={styles.iconButtonLabel}>Archivo</Text>
          </TouchableOpacity>
        </View>

        {archivosSeleccionados.length > 0 && (
          <View style={styles.archivosGrid}>
            {archivosSeleccionados.map((archivo, index) => (
              <View key={index} style={styles.archivoItem}>
                <Ionicons
                  name={archivo.type.startsWith('image/') ? 'image' : 'document'}
                  size={16}
                  color={COLORS.primary}
                />
                <Text style={styles.archivoNombre} numberOfLines={1}>
                  {archivo.name}
                </Text>
                <TouchableOpacity onPress={() => eliminarArchivo(index)}>
                  <Ionicons name="close-circle" size={20} color={COLORS.error} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Botón confirmar */}
      <TouchableOpacity
        style={[styles.button, (!formaPago || guardando) && styles.buttonDisabled]}
        onPress={confirmar}
        disabled={!formaPago || guardando}
      >
        {guardando || subiendoEvidencias ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={COLORS.white} size="small" />
            <Text style={styles.buttonText}>
              {subiendoEvidencias ? 'Subiendo evidencias...' : 'Guardando...'}
            </Text>
          </View>
        ) : (
          <Text style={styles.buttonText}>Confirmar registro</Text>
        )}
      </TouchableOpacity>
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
  // Fila superior: Empleado + Total
  topRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  employeeCard: {
    flex: 1,
    backgroundColor: COLORS.cardBackground,
    padding: 14,
    borderRadius: 12,
  },
  cardLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  employeeName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  totalCard: {
    flex: 1,
    backgroundColor: '#e8f8f5',
    padding: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.primary + '33',
  },
  totalMonto: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  // Secciones
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  // Grid de servicios
  serviciosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  servicioItem: {
    backgroundColor: COLORS.cardBackground,
    padding: 12,
    borderRadius: 10,
    minWidth: 150,
    flex: 1,
    maxWidth: '48%',
  },
  servicioNombre: {
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 6,
  },
  servicioValor: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primary,
  },
  // Inputs (propina / observaciones)
  input: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.primary + '22',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  helperText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 6,
  },
  // Forma de pago
  formaPagoRow: {
    flexDirection: 'row',
    gap: 12,
  },
  option: {
    flex: 1,
    backgroundColor: COLORS.cardBackground,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '10',
  },
  optionIcon: {
    fontSize: 28,
  },
  optionText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  optionTextSelected: {
    color: COLORS.primary,
  },
  // Evidencias
  evidenceOptionsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 12,
  },
  iconButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
    padding: 16,
    minWidth: 90,
    borderWidth: 1,
    borderColor: COLORS.primary + '33',
  },
  iconButtonLabel: {
    marginTop: 6,
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  archivosGrid: {
    marginTop: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  archivoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.cardBackground,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary + '22',
  },
  archivoNombre: {
    maxWidth: 150,
    fontSize: 13,
    color: COLORS.text,
  },
  // Botón
  button: {
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 30,
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
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
