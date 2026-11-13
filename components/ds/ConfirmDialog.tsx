import { FONT_SIZE, FONT_WEIGHT, RADIUS, SPACING, sombra, useTheme } from '@/theme';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from './Button';
import { Icon, type IconName } from './Icon';

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Acción destructiva (eliminar): el botón de confirmar va en rojo. */
  destructive?: boolean;
  icon?: IconName;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Diálogo de confirmación único para eliminar, inactivar o confirmar acciones. */
export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  destructive = false,
  icon,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const { tema } = useTheme();
  const c = tema.colores;
  const nombreIcono: IconName = icon ?? (destructive ? 'trash-outline' : 'help-circle-outline');

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={[estilos.fondo, { backgroundColor: c.overlay }]} onPress={loading ? undefined : onCancel}>
        <Pressable
          style={[estilos.caja, { backgroundColor: c.superficieElevada, borderColor: c.borde }, sombra(tema, 'lg')]}
          onPress={() => {}}
        >
          <View style={[estilos.icono, { backgroundColor: destructive ? c.errorSuave : c.primarioSuave }]}>
            <Icon name={nombreIcono} size={24} color={destructive ? c.errorTexto : c.primarioTexto} />
          </View>
          <Text style={[estilos.titulo, { color: c.texto }]}>{title}</Text>
          {message ? <Text style={[estilos.mensaje, { color: c.textoSuave }]}>{message}</Text> : null}
          <View style={estilos.acciones}>
            <Button title={cancelLabel} variant="secondary" onPress={onCancel} disabled={loading} style={estilos.boton} />
            <Button
              title={confirmLabel}
              variant={destructive ? 'dangerSolid' : 'primary'}
              onPress={onConfirm}
              loading={loading}
              style={estilos.boton}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const estilos = StyleSheet.create({
  fondo: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.xl },
  caja: { width: '100%', maxWidth: 420, borderRadius: RADIUS.xxl, borderWidth: 1, padding: SPACING.xl, alignItems: 'center' },
  icono: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.md },
  titulo: { fontSize: FONT_SIZE.title3, fontWeight: FONT_WEIGHT.bold, textAlign: 'center' },
  mensaje: { fontSize: FONT_SIZE.callout, textAlign: 'center', marginTop: SPACING.sm, lineHeight: 21 },
  acciones: { flexDirection: 'row', gap: SPACING.md, marginTop: SPACING.xl, alignSelf: 'stretch' },
  boton: { flex: 1 },
});
