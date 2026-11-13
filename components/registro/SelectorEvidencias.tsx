import { AppText, Icon, IconButton, type IconName } from '@/components/ds';
import { ALTURA_TACTIL, FONT_SIZE, FONT_WEIGHT, RADIUS, SPACING, useEstilos, useTheme, type Tema } from '@/theme';
import { Pressable, View } from 'react-native';
import type { ArchivoSeleccionado } from './tipos';

interface SelectorEvidenciasProps {
  archivos: ArchivoSeleccionado[];
  onCamara: () => void;
  onGaleria: () => void;
  onArchivo: () => void;
  onQuitar: (index: number) => void;
}

/** Tres accesos (cámara, galería, archivo) y la lista de archivos elegidos. */
export function SelectorEvidencias({ archivos, onCamara, onGaleria, onArchivo, onQuitar }: SelectorEvidenciasProps) {
  const estilos = useEstilos(crearEstilos);
  const { tema } = useTheme();

  return (
    <View>
      <View style={estilos.acciones}>
        <AccionEvidencia icon="camera-outline" label="Cámara" onPress={onCamara} />
        <AccionEvidencia icon="images-outline" label="Galería" onPress={onGaleria} />
        <AccionEvidencia icon="attach-outline" label="Archivo" onPress={onArchivo} />
      </View>

      {archivos.length > 0 ? (
        <View style={estilos.lista}>
          <AppText variante="nota" tono="suave">
            {archivos.length} archivo(s) seleccionado(s)
          </AppText>
          {archivos.map((archivo, index) => (
            <View key={index} style={estilos.archivo}>
              <Icon
                name={archivo.type?.includes('pdf') ? 'document-text-outline' : 'image-outline'}
                size={18}
                color={tema.colores.primarioTexto}
              />
              <AppText variante="nota" numberOfLines={1} style={estilos.archivoNombre}>
                {archivo.name}
              </AppText>
              <IconButton
                icon="trash-outline"
                variant="danger"
                size="sm"
                accessibilityLabel={`Quitar ${archivo.name}`}
                onPress={() => onQuitar(index)}
              />
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function AccionEvidencia({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  const estilos = useEstilos(crearEstilos);
  const { tema } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [estilos.accion, { opacity: pressed ? 0.85 : 1 }]}
    >
      <Icon name={icon} size={24} color={tema.colores.primarioTexto} />
      <AppText style={estilos.accionTexto} numberOfLines={1}>
        {label}
      </AppText>
    </Pressable>
  );
}

const crearEstilos = (t: Tema) => ({
  acciones: { flexDirection: 'row' as const, gap: SPACING.sm },
  accion: {
    flex: 1,
    minWidth: 0,
    minHeight: ALTURA_TACTIL + 28,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: SPACING.xs,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xs,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: t.colores.primarioBorde,
    backgroundColor: t.colores.superficie,
  },
  accionTexto: { fontSize: FONT_SIZE.subhead, fontWeight: FONT_WEIGHT.semibold, color: t.colores.primarioTexto },
  lista: { marginTop: SPACING.md, gap: SPACING.sm },
  archivo: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: SPACING.sm,
    paddingLeft: SPACING.md,
    paddingRight: SPACING.xs,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.lg,
    backgroundColor: t.colores.fondoSuave,
  },
  archivoNombre: { flex: 1, minWidth: 0 },
});
