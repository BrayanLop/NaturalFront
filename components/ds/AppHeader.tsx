import { FONT_SIZE, FONT_WEIGHT, RADIUS, SPACING, useTheme } from '@/theme';
import React from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from './Icon';
import { IconButton } from './IconButton';

interface AppHeaderProps {
  options: { title?: string; headerLeft?: (props: { canGoBack?: boolean }) => React.ReactNode };
  /** Presente cuando hay una pantalla anterior a la que volver. */
  back?: unknown;
  navigation: { goBack: () => void };
  usuario?: { nombre?: string } | null;
  onUserPress?: () => void;
  onBackFallback?: () => void;
}

/**
 * Encabezado propio (en lugar del nativo). Motivos:
 *  - iOS 26 envuelve los botones del encabezado nativo en "píldoras de vidrio" con sombra, y deja una
 *    mancha gris bajo la barra. Aquí no hay sombras ni vidrio.
 *  - Se adapta al tema claro/oscuro y se ve igual en iOS, Android y web.
 *
 * Pantallas angostas (< 420 px): el usuario se muestra solo como avatar, para dejar espacio al título.
 */
export default function AppHeader({ options, back, navigation, usuario, onUserPress, onBackFallback }: AppHeaderProps) {
  const { tema } = useTheme();
  const c = tema.colores;
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const angosto = width < 420;
  const simetrico = !!options.headerLeft;
  const nombre = usuario?.nombre?.split(' ')[0] || 'Usuario';

  const izquierda = options.headerLeft ? (
    options.headerLeft({ canGoBack: !!back })
  ) : back ? (
    <IconButton icon="chevron-back" variant="header" accessibilityLabel="Volver" onPress={() => navigation.goBack()} />
  ) : onBackFallback ? (
    <IconButton icon="chevron-back" variant="header" accessibilityLabel="Volver" onPress={onBackFallback} />
  ) : null;

  return (
    <View style={[estilos.barra, { backgroundColor: c.encabezado, paddingTop: insets.top }]}>
      <View style={estilos.fila}>
        <View style={[estilos.lado, simetrico ? estilos.ladoFlex : estilos.ladoIzq]}>{izquierda}</View>

        <Text
          style={[estilos.titulo, { color: c.sobreEncabezado }, simetrico && estilos.tituloFijo]}
          numberOfLines={1}
          adjustsFontSizeToFit
          accessibilityRole="header"
        >
          {options.title ?? ''}
        </Text>

        <View style={[estilos.lado, simetrico ? estilos.ladoFlex : estilos.ladoDer, estilos.alinearDerecha]}>
          <Pressable
            onPress={onUserPress}
            accessibilityRole="button"
            accessibilityLabel={`Menú de ${nombre}`}
            style={({ pressed }) => [
              estilos.usuario,
              { backgroundColor: c.encabezadoControl, opacity: pressed ? 0.85 : 1 },
              angosto && estilos.usuarioSoloAvatar,
            ]}
          >
            <View style={[estilos.avatar, { backgroundColor: c.blanco }]}>
              <Icon name="person" size={16} color={c.primario} />
            </View>
            {!angosto ? (
              <Text style={[estilos.nombre, { color: c.sobreEncabezado }]} numberOfLines={1}>
                {nombre}
              </Text>
            ) : null}
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  barra: { paddingBottom: SPACING.sm },
  fila: { flexDirection: 'row', alignItems: 'center', minHeight: 52, paddingHorizontal: SPACING.md },
  lado: { justifyContent: 'center' },
  ladoIzq: { minWidth: 44, alignItems: 'flex-start' },
  ladoDer: { minWidth: 44 },
  ladoFlex: { flex: 1 },
  alinearDerecha: { alignItems: 'flex-end' },
  titulo: {
    flex: 1,
    textAlign: 'center',
    fontSize: FONT_SIZE.headline,
    fontWeight: FONT_WEIGHT.bold,
    marginHorizontal: SPACING.sm,
  },
  tituloFijo: { flex: 0, minWidth: 80 },
  usuario: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    borderRadius: RADIUS.full,
    paddingLeft: 4,
    paddingRight: SPACING.md,
  },
  usuarioSoloAvatar: { paddingRight: 4 },
  avatar: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  nombre: { marginLeft: SPACING.sm, fontSize: FONT_SIZE.subhead, fontWeight: FONT_WEIGHT.semibold, maxWidth: 110 },
});
