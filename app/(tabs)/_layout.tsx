import AppHeader from '@/components/ds/AppHeader';
import BannerSoporte from '@/components/BannerSoporte';
import { Icon } from '@/components/ds';
import SelectorApariencia from '@/components/SelectorApariencia';
import { useAuth } from '@/context/authContext';
import { FONT_SIZE, FONT_WEIGHT, RADIUS, SPACING, sombra, useTheme } from '@/theme';
import { getRoleName, isPlataforma } from '@/utils/roles';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function Layout() {
  const { usuario, cargando, logout } = useAuth();
  const router = useRouter();
  const [menuVisible, setMenuVisible] = useState(false);
  const insets = useSafeAreaInsets();
  const { tema } = useTheme();

  useEffect(() => {
    if (!cargando && !usuario) {
      router.replace('/login');
    }
  }, [cargando, usuario]);

  // Separación de menús: el superadmin de plataforma (rol 00) solo ve plataforma/*, home y cambiar contraseña;
  // cualquier otro rol (incluido el admin al que se entra en modo soporte) no puede abrir plataforma/*.
  const segments = useSegments();
  useEffect(() => {
    if (cargando || !usuario) return;
    const seccion = (segments as string[])[1];
    if (!seccion) return;
    const esPlataforma = isPlataforma(usuario.rol);
    const permitidasPlataforma = ['home', 'index', 'plataforma', 'cambiarContrasena'];
    if ((esPlataforma && !permitidasPlataforma.includes(seccion)) || (!esPlataforma && seccion === 'plataforma')) {
      router.replace('/home');
    }
  }, [segments, usuario, cargando]);

  if (cargando) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: tema.colores.fondo }]}>
        <ActivityIndicator size="large" color={tema.colores.primarioFuerte} />
      </View>
    );
  }

  if (!usuario) {
    return null;
  }

  return (
    <>
      <View style={{ flex: 1 }}>
      <Stack
        screenOptions={{
          contentStyle: {
            paddingLeft: insets.left,
            paddingRight: insets.right,
            // Evita que el contenido (y botones al fondo) queden ocultos tras la
            // barra de navegación de Android / el home indicator de iOS.
            paddingBottom: insets.bottom,
          },
          // Encabezado propio: sin "píldoras de vidrio" de iOS 26, claro/oscuro y adaptable a pantallas angostas.
          header: ({ navigation, options, back }) => (
            <AppHeader
              navigation={navigation}
              options={options as { title?: string; headerLeft?: (props: { canGoBack?: boolean }) => React.ReactNode }}
              back={back}
              usuario={usuario}
              onUserPress={() => setMenuVisible(true)}
              onBackFallback={() => router.replace('/(tabs)/home')}
            />
          ),
      }}
    >
      {/* Personalizamos los títulos */}
      <Stack.Screen 
        name="home" 
        options={{ 
          title: 'Natural', 
          headerLeft: () => (
            <View style={{ marginLeft: 4, maxWidth: '100%' }}>
              <Text
                style={{ color: tema.colores.sobreEncabezado, fontWeight: FONT_WEIGHT.semibold, fontSize: FONT_SIZE.subhead }}
                numberOfLines={1}
              >
                {usuario?.nombreEmpresa || 'Empresa'}
              </Text>
            </View>
          )
        }} 
      />
      <Stack.Screen name="personas/index" options={{ title: 'Personas' }} />
      <Stack.Screen name="personas/crear" options={{ title: 'Crear persona' }} />
      <Stack.Screen name="personas/[id]" options={{ title: 'Editar persona' }} />
      <Stack.Screen name="servicios/index" options={{ title: 'Servicios' }} />
      <Stack.Screen name="servicios/crear" options={{ title: 'Crear servicio' }} />
      <Stack.Screen name="servicios/[id]" options={{ title: 'Editar servicio' }} />
      <Stack.Screen name="configuracion" options={{ title: 'Configuración general' }} />
      <Stack.Screen name="registroServicio" options={{ title: 'Registro servicio' }} />
      <Stack.Screen name="registroServicio/index" options={{ title: 'Registro servicio' }} />
      <Stack.Screen name="registroServicio/personas" options={{ title: 'Personas' }} />
      <Stack.Screen name="registroServicio/servicios" options={{ title: 'Servicios' }} />
      <Stack.Screen name="configuracion/index" options={{ title: 'Configuración general' }} />
      <Stack.Screen name="configuracionServicio/index" options={{ title: 'Configuración servicios' }} />
      <Stack.Screen name="configuracionServicio/crear" options={{ title: 'Crear configuración' }} />
      <Stack.Screen name="configuracionServicio/[id]" options={{ title: 'Editar configuración' }} />
      <Stack.Screen name="contabilidad/index" options={{ title: 'Pagos' }} />
      <Stack.Screen name="contabilidad/historico" options={{ title: 'Histórico pagos' }} />
      <Stack.Screen name="contabilidad/detalleServicioPersona/[id]" options={{ title: 'Detalle pago' }} />
      <Stack.Screen name="contabilidad/comprobante/[id]" options={{ title: 'Comprobante' }} />
      <Stack.Screen name="cambiarContrasena" options={{ title: 'Cambiar contraseña' }} />
      <Stack.Screen name="ingresos/index" options={{ title: 'Ingresos' }} />
      <Stack.Screen name="egresos/index" options={{ title: 'Egresos' }} />
      <Stack.Screen name="egresos/crear" options={{ title: 'Registrar egreso' }} />
      <Stack.Screen name="consolidadoIngresos" options={{ title: 'Consolidado' }} />
      <Stack.Screen name="consolidadoFormaPago" options={{ title: 'Total por formas de pago' }} />
      <Stack.Screen name="finanzas/index" options={{ title: 'Finanzas' }} />
      <Stack.Screen name="catalogo" options={{ title: 'Catálogo' }} />
      <Stack.Screen name="accesos/index" options={{ title: 'Accesos' }} />
      <Stack.Screen name="accesos/crear" options={{ title: 'Crear acceso' }} />
      <Stack.Screen name="accesos/[id]" options={{ title: 'Detalle de acceso' }} />
      <Stack.Screen name="plataforma/empresas/index" options={{ title: 'Empresas' }} />
      <Stack.Screen name="plataforma/empresas/crear" options={{ title: 'Crear empresa' }} />
      <Stack.Screen name="plataforma/empresas/[id]/index" options={{ title: 'Empresa' }} />
      <Stack.Screen name="plataforma/empresas/[id]/accesos/index" options={{ title: 'Accesos de la empresa' }} />
      <Stack.Screen name="plataforma/empresas/[id]/accesos/crear" options={{ title: 'Crear acceso' }} />
      <Stack.Screen name="plataforma/empresas/[id]/accesos/[usuarioId]" options={{ title: 'Detalle de acceso' }} />
      <Stack.Screen name="plataforma/auditoria/index" options={{ title: 'Auditoría' }} />
    </Stack>
      {/* Banner fijo del modo soporte (solo se ve si el superadmin entró como una empresa) */}
      <BannerSoporte />
      </View>

    {/* Menú desplegable del usuario */}
    <Modal
      visible={menuVisible}
      transparent
      animationType="fade"
      onRequestClose={() => setMenuVisible(false)}
    >
      <Pressable style={[menuEstilos.fondo, { backgroundColor: tema.colores.overlay, paddingTop: insets.top + 56 }]} onPress={() => setMenuVisible(false)}>
        <Pressable
          onPress={() => {}}
          style={[
            menuEstilos.caja,
            { backgroundColor: tema.colores.superficieElevada, borderColor: tema.colores.borde },
            sombra(tema, 'lg'),
          ]}
        >
          <View style={[menuEstilos.cabecera, { backgroundColor: tema.colores.fondoSuave }]}>
            <View style={[menuEstilos.avatar, { backgroundColor: tema.colores.primarioSuave }]}>
              <Icon name="person-outline" size={22} color={tema.colores.primarioTexto} />
            </View>
            <View style={menuEstilos.textos}>
              <Text style={[menuEstilos.nombre, { color: tema.colores.texto }]} numberOfLines={1}>
                {usuario?.nombre || 'Usuario'}
              </Text>
              <Text style={[menuEstilos.rol, { color: tema.colores.textoSuave }]}>
                {usuario?.rol ? getRoleName(usuario.rol) : 'Usuario'}
              </Text>
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [menuEstilos.item, pressed && { backgroundColor: tema.colores.fondoSuave }]}
            onPress={() => {
              setMenuVisible(false);
              router.push('/(tabs)/cambiarContrasena');
            }}
          >
            <Icon name="key-outline" size={20} color={tema.colores.primarioTexto} />
            <Text style={[menuEstilos.itemTexto, { color: tema.colores.texto }]}>Cambiar contraseña</Text>
            <Icon name="chevron-forward" size={16} color={tema.colores.textoTenue} />
          </Pressable>

          <View style={[menuEstilos.divisor, { backgroundColor: tema.colores.divisor }]} />

          <SelectorApariencia />

          <View style={[menuEstilos.divisor, { backgroundColor: tema.colores.divisor }]} />

          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [menuEstilos.item, pressed && { backgroundColor: tema.colores.fondoSuave }]}
            onPress={() => {
              setMenuVisible(false);
              logout();
            }}
          >
            <Icon name="log-out-outline" size={20} color={tema.colores.textoSuave} />
            <Text style={[menuEstilos.itemTexto, { color: tema.colores.textoSuave }]}>Cerrar sesión</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

const menuEstilos = StyleSheet.create({
  fondo: { flex: 1, justifyContent: 'flex-start', alignItems: 'flex-end', paddingRight: SPACING.md },
  caja: { borderRadius: RADIUS.xl, borderWidth: 1, width: 280, maxWidth: '100%', overflow: 'hidden' },
  cabecera: { flexDirection: 'row', alignItems: 'center', padding: SPACING.lg, gap: SPACING.md },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  textos: { flex: 1, minWidth: 0 },
  nombre: { fontSize: FONT_SIZE.headline, fontWeight: FONT_WEIGHT.semibold },
  rol: { fontSize: FONT_SIZE.footnote, marginTop: 2 },
  item: { flexDirection: 'row', alignItems: 'center', minHeight: 52, paddingHorizontal: SPACING.lg, gap: SPACING.md },
  itemTexto: { flex: 1, fontSize: FONT_SIZE.callout, fontWeight: FONT_WEIGHT.medium },
  divisor: { height: 1, marginHorizontal: SPACING.lg },
});
