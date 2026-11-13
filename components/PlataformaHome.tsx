import { Button, Icon, type IconName } from '@/components/ds';
import { useAuth } from '@/context/authContext';
import {
  COLORES_DETALLE,
  COLORES_MODULO,
  FONT_SIZE,
  FONT_WEIGHT,
  RADIUS,
  SPACING,
  sombra,
  useEstilos,
  useTheme,
  type Tema,
} from '@/theme';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';

const ITEMS: { title: string; route: string; icon: IconName; color: string; description: string }[] = [
  { title: 'Empresas', route: '/plataforma/empresas', icon: 'business', color: COLORES_MODULO.registrar, description: 'Tenants, accesos y soporte' },
  { title: 'Auditoría', route: '/plataforma/auditoria', icon: 'list', color: COLORES_DETALLE.historico, description: 'Qué se hizo y quién' },
];

const crearEstilos = (t: Tema) => ({
  container: { flex: 1, backgroundColor: t.colores.fondo },
  scroll: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.xl, paddingBottom: SPACING.huge },
  welcome: { marginBottom: SPACING.xl, paddingHorizontal: SPACING.xs },
  welcomeText: { fontSize: FONT_SIZE.body, color: t.colores.textoSuave },
  userName: { fontSize: FONT_SIZE.title1, fontWeight: FONT_WEIGHT.bold, color: t.colores.texto, marginTop: SPACING.xxs },
  subtitle: { fontSize: FONT_SIZE.body, color: t.colores.primarioTexto, fontWeight: FONT_WEIGHT.medium, marginTop: SPACING.xxs },
  grid: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, justifyContent: 'space-between' as const, gap: SPACING.md },
  card: {
    width: '48%' as const,
    backgroundColor: t.colores.superficie,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    paddingVertical: SPACING.xl,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: t.colores.borde,
    ...sombra(t, 'sm'),
  },
  cardPressed: { opacity: 0.92, transform: [{ scale: 0.98 }] },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: RADIUS.round,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginBottom: SPACING.md,
    ...sombra(t, 'sm'),
  },
  cardTitle: { fontSize: FONT_SIZE.body, fontWeight: FONT_WEIGHT.semibold, color: t.colores.texto, textAlign: 'center' as const, marginBottom: SPACING.xxs },
  cardDescription: { fontSize: FONT_SIZE.footnote, color: t.colores.textoSuave, textAlign: 'center' as const, lineHeight: 16 },
  logout: { marginTop: SPACING.xxl, alignItems: 'center' as const },
});

/** Home del superadmin de plataforma (rol 00): solo administra tenants, no ve menús de negocio. */
export default function PlataformaHome() {
  const { usuario, logout } = useAuth();
  const router = useRouter();
  const { tema } = useTheme();
  const estilos = useEstilos(crearEstilos);

  return (
    <View style={estilos.container}>
      <ScrollView contentContainerStyle={estilos.scroll} showsVerticalScrollIndicator={false}>
        <View style={estilos.welcome}>
          <Text style={estilos.welcomeText}>Bienvenido,</Text>
          <Text style={estilos.userName}>{usuario?.nombre}</Text>
          <Text style={estilos.subtitle}>Administración de la plataforma</Text>
        </View>

        <View style={estilos.grid}>
          {ITEMS.map((item) => (
            <Pressable
              key={item.route}
              accessibilityRole="button"
              accessibilityLabel={`${item.title}. ${item.description}`}
              style={({ pressed }) => [estilos.card, pressed && estilos.cardPressed]}
              onPress={() => router.push(item.route as any)}
            >
              <View style={[estilos.iconCircle, { backgroundColor: item.color }]}>
                <Icon name={item.icon} size={24} color={tema.colores.blanco} />
              </View>
              <Text style={estilos.cardTitle}>{item.title}</Text>
              <Text style={estilos.cardDescription} numberOfLines={2}>
                {item.description}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={estilos.logout}>
          <Button title="Cerrar sesión" icon="log-out-outline" variant="ghost" fullWidth={false} align="center" onPress={logout} />
        </View>
      </ScrollView>
    </View>
  );
}
