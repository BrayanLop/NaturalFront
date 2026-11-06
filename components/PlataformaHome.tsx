import { COLORS, FONT_SIZE, FONT_WEIGHT, RADIUS, SHADOWS, SPACING } from '@/constants/theme';
import { useAuth } from '@/context/authContext';
import { FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

const ITEMS = [
  { title: 'Empresas', route: '/plataforma/empresas', icon: 'building', color: COLORS.primary, description: 'Tenants, accesos y soporte' },
  { title: 'Auditoría', route: '/plataforma/auditoria', icon: 'clipboard-list', color: '#8e44ad', description: 'Qué se hizo y quién' },
];

/** Home del superadmin de plataforma (rol 00): solo administra tenants, no ve menús de negocio. */
export default function PlataformaHome() {
  const { usuario, logout } = useAuth();
  const router = useRouter();

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.welcome}>
          <Text style={styles.welcomeText}>Bienvenido,</Text>
          <Text style={styles.userName}>{usuario?.nombre}</Text>
          <Text style={styles.subtitle}>Administración de la plataforma</Text>
        </View>

        <View style={styles.grid}>
          {ITEMS.map((item) => (
            <Pressable
              key={item.route}
              style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
              onPress={() => router.push(item.route as any)}
            >
              <View style={[styles.iconCircle, { backgroundColor: item.color }]}>
                <FontAwesome5 name={item.icon} size={22} color="white" />
              </View>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardDescription} numberOfLines={1}>
                {item.description}
              </Text>
            </Pressable>
          ))}
        </View>

        <Pressable style={({ pressed }) => [styles.logout, pressed && { opacity: 0.8 }]} onPress={logout}>
          <FontAwesome5 name="sign-out-alt" size={16} color={COLORS.error} />
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.xl, paddingBottom: SPACING.huge },
  welcome: { marginBottom: SPACING.xxl, paddingHorizontal: SPACING.xs },
  welcomeText: { fontSize: FONT_SIZE.body, color: COLORS.textSecondary },
  userName: { fontSize: FONT_SIZE.title1, fontWeight: FONT_WEIGHT.bold, color: COLORS.text, marginTop: SPACING.xxs },
  subtitle: { fontSize: FONT_SIZE.body, color: COLORS.primary, fontWeight: FONT_WEIGHT.medium, marginTop: SPACING.xxs },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: SPACING.md },
  card: {
    width: '48%',
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    paddingVertical: SPACING.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  cardPressed: { opacity: 0.95, transform: [{ scale: 0.98 }], backgroundColor: COLORS.cardBackgroundHover },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: RADIUS.round,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  cardTitle: { fontSize: FONT_SIZE.body, fontWeight: FONT_WEIGHT.semibold, color: COLORS.text, textAlign: 'center', marginBottom: SPACING.xxs },
  cardDescription: { fontSize: FONT_SIZE.caption, color: COLORS.textSecondary, textAlign: 'center' },
  logout: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.xxxl,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    backgroundColor: COLORS.errorLight,
    borderRadius: RADIUS.md,
    alignSelf: 'center',
    gap: SPACING.sm,
  },
  logoutText: { color: COLORS.error, fontWeight: FONT_WEIGHT.semibold, fontSize: FONT_SIZE.body },
});
