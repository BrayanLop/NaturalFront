import { Card } from '@/components/ds';
import { FONT_SIZE, FONT_WEIGHT, RADIUS, SPACING, useEstilos, type Tema } from '@/theme';
import React from 'react';
import { Text, View } from 'react-native';

const crearEstilos = (t: Tema) => ({
  fila: { flexDirection: 'row' as const, alignItems: 'flex-start' as const },
  icono: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.lg,
    backgroundColor: t.colores.primarioSuave,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginRight: SPACING.md,
  },
  textos: { flex: 1, minWidth: 0 },
  cabecera: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'flex-start' as const },
  cabeceraIzq: { flex: 1, minWidth: 0, gap: SPACING.xs },
  titulo: { fontSize: FONT_SIZE.callout, fontWeight: FONT_WEIGHT.semibold, color: t.colores.texto },
  subtitulo: { fontSize: FONT_SIZE.subhead, color: t.colores.texto, marginTop: SPACING.xxs },
  descripcion: { fontSize: FONT_SIZE.subhead, color: t.colores.textoSuave, marginTop: SPACING.xs, lineHeight: 20 },
});

/**
 * Compatibilidad: conserva la API anterior pero dibuja sobre `Card` del sistema de diseño.
 * Al migrar cada pantalla se reemplaza por `<ListRow />` de `@/components/ds`.
 */
interface ListCardProps {
  title: string;
  subtitle?: string;
  description?: string;
  badges?: React.ReactNode;
  onPress?: () => void;
  rightContent?: React.ReactNode;
  leftIcon?: React.ReactNode;
}

const ListCard = React.memo(function ListCard({
  title,
  subtitle,
  description,
  badges,
  onPress,
  rightContent,
  leftIcon,
}: ListCardProps) {
  const estilos = useEstilos(crearEstilos);
  return (
    <Card onPress={onPress}>
      <View style={estilos.fila}>
        {leftIcon ? <View style={estilos.icono}>{leftIcon}</View> : null}
        <View style={estilos.textos}>
          <View style={estilos.cabecera}>
            <View style={estilos.cabeceraIzq}>
              <Text style={estilos.titulo} numberOfLines={1}>
                {title}
              </Text>
              {badges}
            </View>
            {rightContent}
          </View>
          {subtitle ? (
            <Text style={estilos.subtitulo} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
          {description ? (
            <Text style={estilos.descripcion} numberOfLines={2}>
              {description}
            </Text>
          ) : null}
        </View>
      </View>
    </Card>
  );
});

export default ListCard;
