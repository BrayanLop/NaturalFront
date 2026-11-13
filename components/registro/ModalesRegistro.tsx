import { AppText, Button, EmptyState, Input, LoadingState } from '@/components/ds';
import { RADIUS, SPACING, useEstilos, type Tema } from '@/theme';
import { formatDate } from '@/utils/formatters';
import type { ReactNode } from 'react';
import { Image, Linking, ScrollView, View } from 'react-native';
import type { Evidencia, RegistroServicio } from '@/app/api/modelos/registroServicio';
import { HojaModal, ResumenRegistroModal } from './HojaModal';
import { SelectorEvidencias } from './SelectorEvidencias';
import type { ArchivoSeleccionado } from './tipos';

const detalleRegistro = (r: RegistroServicio) => `${r.nombreServicio} - ${formatDate(r.fechaServicio)}`;

// ---------------------------------------------------------------------------
// Subir evidencias a un registro existente
// ---------------------------------------------------------------------------
interface ModalSubirEvidenciaProps {
  visible: boolean;
  registro: RegistroServicio | null;
  archivos: ArchivoSeleccionado[];
  subiendo: boolean;
  onClose: () => void;
  onCamara: () => void;
  onGaleria: () => void;
  onArchivo: () => void;
  onQuitar: (index: number) => void;
  onConfirmar: () => void;
}

export function ModalSubirEvidencia({
  visible,
  registro,
  archivos,
  subiendo,
  onClose,
  onCamara,
  onGaleria,
  onArchivo,
  onQuitar,
  onConfirmar,
}: ModalSubirEvidenciaProps) {
  const estilos = useEstilos(crearEstilos);
  return (
    <HojaModal visible={visible} title="Subir evidencia" onClose={onClose}>
      <ScrollView contentContainerStyle={estilos.cuerpo}>
        {registro ? <ResumenRegistroModal persona={registro.nombrePersona} detalle={detalleRegistro(registro)} /> : null}
        <SelectorEvidencias
          archivos={archivos}
          onCamara={onCamara}
          onGaleria={onGaleria}
          onArchivo={onArchivo}
          onQuitar={onQuitar}
        />
        <Button
          title="Subir evidencia(s)"
          icon="cloud-upload-outline"
          onPress={onConfirmar}
          loading={subiendo}
          disabled={archivos.length === 0 || subiendo}
          style={estilos.accionFinal}
        />
      </ScrollView>
    </HojaModal>
  );
}

// ---------------------------------------------------------------------------
// Ver evidencias de un registro
// ---------------------------------------------------------------------------
interface ModalVerEvidenciasProps {
  visible: boolean;
  cargando: boolean;
  evidencias: Evidencia[];
  onClose: () => void;
}

export function ModalVerEvidencias({ visible, cargando, evidencias, onClose }: ModalVerEvidenciasProps) {
  const estilos = useEstilos(crearEstilos);
  let contenido: ReactNode;
  if (cargando) {
    contenido = <LoadingState message="Cargando evidencias..." />;
  } else if (evidencias.length === 0) {
    contenido = <EmptyState icon="image-outline" title="No hay evidencias para este registro" />;
  } else {
    contenido = (
      <ScrollView contentContainerStyle={estilos.cuerpo}>
        <View style={estilos.grilla}>
          {evidencias.map((evidencia) => (
            <View key={evidencia.id} style={estilos.evidencia}>
              <Image source={{ uri: evidencia.urlEvidencia }} style={estilos.imagen} resizeMode="cover" />
              <View style={estilos.evidenciaPie}>
                <AppText variante="nota" numberOfLines={1} style={estilos.evidenciaNombre}>
                  {evidencia.nombreArchivo}
                </AppText>
                <Button
                  title="Abrir"
                  icon="open-outline"
                  variant="ghost"
                  size="sm"
                  fullWidth={false}
                  onPress={() => Linking.openURL(evidencia.urlEvidencia)}
                />
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    );
  }
  return (
    <HojaModal visible={visible} title="Evidencias" onClose={onClose}>
      {contenido}
    </HojaModal>
  );
}

// ---------------------------------------------------------------------------
// Rechazar un registro (motivo opcional)
// ---------------------------------------------------------------------------
interface ModalRechazoProps {
  registro: RegistroServicio | null;
  motivo: string;
  onChangeMotivo: (texto: string) => void;
  rechazando: boolean;
  onClose: () => void;
  onConfirmar: () => void;
}

export function ModalRechazo({ registro, motivo, onChangeMotivo, rechazando, onClose, onConfirmar }: ModalRechazoProps) {
  const estilos = useEstilos(crearEstilos);
  return (
    <HojaModal visible={registro !== null} title="Rechazar registro" onClose={onClose}>
      <ScrollView contentContainerStyle={estilos.cuerpo} keyboardShouldPersistTaps="handled">
        {registro ? <ResumenRegistroModal persona={registro.nombrePersona} detalle={detalleRegistro(registro)} /> : null}
        <Input
          label="Motivo del rechazo (opcional)"
          value={motivo}
          onChangeText={onChangeMotivo}
          placeholder="Ej: Evidencia ilegible, valor incorrecto..."
          multiline
          numberOfLines={3}
          maxLength={256}
        />
        <Button
          title="Confirmar rechazo"
          icon="close-circle-outline"
          variant="danger"
          onPress={onConfirmar}
          loading={rechazando}
          disabled={rechazando}
        />
      </ScrollView>
    </HojaModal>
  );
}

const crearEstilos = (t: Tema) => ({
  cuerpo: { padding: SPACING.lg },
  accionFinal: { marginTop: SPACING.lg },
  grilla: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: SPACING.md },
  evidencia: {
    flexGrow: 1,
    flexBasis: 200,
    minWidth: 0,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: t.colores.borde,
    backgroundColor: t.colores.superficie,
    overflow: 'hidden' as const,
  },
  imagen: { width: '100%' as const, aspectRatio: 4 / 3, backgroundColor: t.colores.fondoSuave },
  evidenciaPie: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: SPACING.sm,
    paddingLeft: SPACING.md,
    paddingRight: SPACING.xs,
    paddingVertical: SPACING.xs,
  },
  evidenciaNombre: { flex: 1, minWidth: 0 },
});
