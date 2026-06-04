import { COLORS, FONT_SIZE, FONT_WEIGHT, RADIUS, SHADOWS, SPACING } from '@/constants/theme';
import { useCitasAuth } from '@/context/citasAuthContext';
import { FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

type MenuItem = {
  title: string;
  route: string;
  icon: string;
  color: string;
  description: string;
};

export default function CitasHome() {
  const { session, logout } = useCitasAuth();
  const router = useRouter();

  if (!session) return null;

  const esEmpresa = session.mode === 'empresa';

  const menuItems: MenuItem[] = esEmpresa
    ? [
        {
          title: 'Citas',
          route: '/citas/agenda',
          icon: 'calendar-check',
          color: COLORS.primary,
          description: 'Ver y gestionar todas las citas',
        },
        {
          title: 'Agendar cita',
          route: '/citas/agenda/crear',
          icon: 'calendar-plus',
          color: COLORS.secondary,
          description: 'Crear una nueva cita',
        },
        {
          title: 'Servicios',
          route: '/citas/servicios',
          icon: 'concierge-bell',
          color: '#e67e22',
          description: 'Administrar servicios',
        },
        {
          title: 'Clientes y empleados',
          route: '/citas/usuarios',
          icon: 'users',
          color: '#9b59b6',
          description: 'Gestionar usuarios',
        },
      ]
    : [
        {
          title: 'Agendar cita',
          route: '/citas/agenda/crear',
          icon: 'calendar-plus',
          color: COLORS.primary,
          description: 'Reserva un nuevo servicio',
        },
        {
          title: 'Mis citas',
          route: '/citas/agenda',
          icon: 'calendar-check',
          color: COLORS.secondary,
          description: 'Consulta y cancela tus citas',
        },
        {
          title: 'Servicios',
          route: '/citas/servicios',
          icon: 'concierge-bell',
          color: '#e67e22',
          description: 'Ver servicios disponibles',
        },
      ];

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>Hola,</Text>
          <Text style={styles.userName}>{session.usuario}</Text>
          <View style={styles.roleChip}>
            <FontAwesome5
              name={esEmpresa ? 'building' : 'user'}
              size={11}
              color={COLORS.primaryDark}
            />
            <Text style={styles.roleChipText}>
              {esEmpresa ? 'Empresa · administrador' : 'Cliente'} · {session.empresaNombre}
            </Text>
          </View>
        </View>

        <View style={styles.grid}>
          {menuItems.map((item, index) => (
            <Pressable
              key={index}
              style={({ pressed }) => [styles.menuCard, pressed && styles.menuCardPressed]}
              onPress={() => router.push(item.route as any)}
            >
              <View style={[styles.iconCircle, { backgroundColor: item.color }]}>
                <FontAwesome5 name={item.icon} size={22} color="white" />
              </View>
              <Text style={styles.menuTitle}>{item.title}</Text>
              <Text style={styles.menuDescription} numberOfLines={2}>
                {item.description}
              </Text>
            </Pressable>
          ))}
        </View>

        <Pressable
          style={({ pressed }) => [styles.logoutButton, pressed && { opacity: 0.8 }]}
          onPress={logout}
        >
          <FontAwesome5 name="sign-out-alt" size={16} color={COLORS.error} />
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.huge,
  },
  welcomeSection: { marginBottom: SPACING.xxl, paddingHorizontal: SPACING.xs },
  welcomeText: { fontSize: FONT_SIZE.body, color: COLORS.textSecondary },
  userName: {
    fontSize: FONT_SIZE.title1,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.text,
    marginTop: SPACING.xxs,
  },
  roleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    alignSelf: 'flex-start',
    marginTop: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primarySurface,
  },
  roleChipText: {
    fontSize: FONT_SIZE.footnote,
    color: COLORS.primaryDark,
    fontWeight: FONT_WEIGHT.medium,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  menuCard: {
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
  menuCardPressed: {
    opacity: 0.95,
    transform: [{ scale: 0.98 }],
    backgroundColor: COLORS.cardBackgroundHover,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: RADIUS.round,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  menuTitle: {
    fontSize: FONT_SIZE.body,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.xxs,
  },
  menuDescription: {
    fontSize: FONT_SIZE.caption,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  logoutButton: {
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
  logoutText: {
    color: COLORS.error,
    fontWeight: FONT_WEIGHT.semibold,
    fontSize: FONT_SIZE.body,
  },
});
