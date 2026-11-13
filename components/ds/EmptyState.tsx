import { FONT_SIZE, FONT_WEIGHT, SPACING, useTheme } from '@/theme';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Button } from './Button';
import { Icon, type IconName } from './Icon';

interface EmptyStateProps {
  icon?: IconName;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}

/** Estado vacío: icono de línea en círculo suave, título corto, ayuda y acción opcional. */
export function EmptyState({ icon = 'file-tray-outline', title, subtitle, actionLabel, onAction }: EmptyStateProps) {
  const { tema } = useTheme();
  const c = tema.colores;
  return (
    <View style={estilos.contenedor}>
      <View style={[estilos.circulo, { backgroundColor: c.primarioSuave }]}>
        <Icon name={icon} size={30} color={c.primarioTexto} />
      </View>
      <Text style={[estilos.titulo, { color: c.texto }]}>{title}</Text>
      {subtitle ? <Text style={[estilos.subtitulo, { color: c.textoSuave }]}>{subtitle}</Text> : null}
      {actionLabel && onAction ? (
        <View style={estilos.accion}>
          <Button title={actionLabel} onPress={onAction} fullWidth={false} size="sm" />
        </View>
      ) : null}
    </View>
  );
}

/** Estado de carga: indicador y mensaje corto. */
export function LoadingState({ message = 'Cargando...' }: { message?: string }) {
  const { tema } = useTheme();
  const c = tema.colores;
  return (
    <View style={estilos.contenedor}>
      <ActivityIndicator size="large" color={c.primarioFuerte} />
      <Text style={[estilos.subtitulo, { color: c.textoSuave, marginTop: SPACING.md }]}>{message}</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { alignItems: 'center', justifyContent: 'center', padding: SPACING.xxxl },
  circulo: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.lg },
  titulo: { fontSize: FONT_SIZE.title3, fontWeight: FONT_WEIGHT.semibold, textAlign: 'center' },
  subtitulo: { fontSize: FONT_SIZE.callout, textAlign: 'center', marginTop: SPACING.xs },
  accion: { marginTop: SPACING.lg },
});
