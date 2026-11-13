import { AppText, IconButton } from '@/components/ds';
import { RADIUS, SPACING, sombra, useEstilos, type Tema } from '@/theme';
import type { ReactNode } from 'react';
import { Modal, View } from 'react-native';

interface HojaModalProps {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

/** Contenedor común de los modales del módulo: fondo oscurecido, tarjeta centrada y botón de cerrar. */
export function HojaModal({ visible, title, onClose, children }: HojaModalProps) {
  const estilos = useEstilos(crearEstilos);
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={estilos.fondo}>
        <View style={estilos.caja}>
          <View style={estilos.cabecera}>
            <AppText variante="subtitulo" style={estilos.titulo} numberOfLines={1}>
              {title}
            </AppText>
            <IconButton icon="close" variant="ghost" accessibilityLabel="Cerrar" onPress={onClose} />
          </View>
          {children}
        </View>
      </View>
    </Modal>
  );
}

/** Bloque informativo del registro afectado (persona y servicio). No es un control. */
export function ResumenRegistroModal({ persona, detalle }: { persona: string; detalle: string }) {
  const estilos = useEstilos(crearEstilos);
  return (
    <View style={estilos.resumen}>
      <AppText variante="etiqueta">{persona}</AppText>
      <AppText variante="nota" tono="suave" style={estilos.resumenDetalle}>
        {detalle}
      </AppText>
    </View>
  );
}

const crearEstilos = (t: Tema) => ({
  fondo: {
    flex: 1,
    backgroundColor: t.colores.overlay,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    padding: SPACING.lg,
  },
  caja: {
    width: '100%' as const,
    maxWidth: 520,
    maxHeight: '88%' as const,
    backgroundColor: t.colores.superficieElevada,
    borderRadius: RADIUS.xxl,
    borderWidth: 1,
    borderColor: t.colores.borde,
    overflow: 'hidden' as const,
    ...sombra(t, 'lg'),
  },
  cabecera: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingLeft: SPACING.lg,
    paddingRight: SPACING.xs,
    paddingVertical: SPACING.xs,
    borderBottomWidth: 1,
    borderBottomColor: t.colores.divisor,
  },
  titulo: { flex: 1, minWidth: 0 },
  resumen: {
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    backgroundColor: t.colores.fondoSuave,
    marginBottom: SPACING.lg,
  },
  resumenDetalle: { marginTop: 2 },
});
