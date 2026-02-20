import LoadingView from '@/components/LoadingView';
import { COLORS, FONT_SIZE, FONT_WEIGHT, RADIUS, SHADOWS, SPACING } from '@/constants/theme';
import { puedeRegistrarServicios } from '@/utils/roles';
import { FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../context/authContext';

type MenuItem = {
  title: string;
  route: string;
  icon: string;
  color?: string;
  description?: string;
};

export default function Home() {
  const { usuario, logout, cargando } = useAuth();
  const router = useRouter();

  if (cargando) {
    return <LoadingView message="Cargando..." />;
  }

  if (!usuario) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No hay usuario en sesión</Text>
      </View>
    );
  }

  const rol = usuario.rol;
  const personaId = usuario.id;

  // Menú según el rol del usuario
  let menuItems: MenuItem[] = puedeRegistrarServicios(rol)
    ? [
        {
          title: 'Registrar servicios',
          route: '../registroServicio',
          icon: 'clipboard-check',
          color: COLORS.primary,
          description: 'Nuevo registro de servicio',
        },
        {
          title: 'Mis Pagos',
          route: '../contabilidad',
          icon: 'file-invoice-dollar',
          color: COLORS.secondary,
          description: 'Ver pagos pendientes',
        },
        {
          title: 'Histórico',
          route: '../contabilidad/historico',
          icon: 'history',
          color: '#9b59b6',
          description: 'Consultar historial de pagos',
        },
      ]
    : [
        { 
          title: 'Personas', 
          route: '../personas', 
          icon: 'user-plus',
          color: COLORS.secondary,
          description: 'Gestionar personas',
        },
        { 
          title: 'Servicios', 
          route: '../servicios', 
          icon: 'tools',
          color: '#e67e22',
          description: 'Administrar servicios',
        },
        {
          title: 'Config. Servicios',
          route: '../configuracionServicio',
          icon: 'cog',
          color: '#9b59b6',
          description: 'Porcentajes y comisiones',
        },
        {
          title: 'Configuración',
          route: '../configuracion',
          icon: 'cogs',
          color: '#34495e',
          description: 'Ajustes generales',
        },
        {
          title: 'Registrar',
          route: '../registroServicio',
          icon: 'clipboard-check',
          color: COLORS.primary,
          description: 'Nuevo registro de servicio',
        },
        {
          title: 'Pagos',
          route: '../contabilidad',
          icon: 'file-invoice-dollar',
          color: '#16a085',
          description: 'Ver pagos pendientes',
        },
        {
          title: 'Histórico',
          route: '../contabilidad/historico',
          icon: 'history',
          color: '#8e44ad',
          description: 'Historial de pagos',
        },
        {
          title: 'Ingresos',
          route: '../ingresos',
          icon: 'dollar-sign',
          color: '#27ae60',
          description: 'Control de ingresos',
        },
        {
          title: 'Egresos',
          route: '../egresos',
          icon: 'money-bill-wave',
          color: '#e74c3c',
          description: 'Control de gastos',
        },
      ];

  // Agregar Consolidado solo para admin
  if (rol === '01' || rol === '03') {
    menuItems = [
      ...menuItems,
      {
        title: 'Consolidado',
        route: '../consolidadoIngresos',
        icon: 'chart-bar',
        color: '#3498db',
        description: 'Resumen de ingresos',
      },
      {
        title: 'Formas de Pago',
        route: '../consolidadoFormaPago',
        icon: 'money-check-alt',
        color: '#1abc9c',
        description: 'Totales por forma de pago',
      },
    ];
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header de bienvenida */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>Bienvenido,</Text>
          <Text style={styles.userName}>{usuario.nombre}</Text>
          <Text style={styles.companyName}>{usuario.nombreEmpresa || 'Natural'}</Text>
        </View>

        {/* Grid de menú */}
        <View style={styles.grid}>
          {menuItems.map((item, index) => (
            <Pressable
              key={index}
              style={({ pressed }) => [
                styles.menuCard,
                pressed && styles.menuCardPressed,
              ]}
              onPress={() => router.push(item.route as any)}
            >
              <View style={[styles.iconCircle, { backgroundColor: item.color || COLORS.primary }]}>
                <FontAwesome5 name={item.icon} size={22} color="white" />
              </View>
              <Text style={styles.menuTitle}>{item.title}</Text>
              {item.description && (
                <Text style={styles.menuDescription} numberOfLines={1}>
                  {item.description}
                </Text>
              )}
            </Pressable>
          ))}
        </View>

        {/* Botón de cerrar sesión */}
        <Pressable 
          style={({ pressed }) => [
            styles.logoutButton,
            pressed && styles.logoutButtonPressed,
          ]} 
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
  container: { 
    flex: 1, 
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.huge,
  },
  welcomeSection: {
    marginBottom: SPACING.xxl,
    paddingHorizontal: SPACING.xs,
  },
  welcomeText: {
    fontSize: FONT_SIZE.body,
    color: COLORS.textSecondary,
  },
  userName: {
    fontSize: FONT_SIZE.title1,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.text,
    marginTop: SPACING.xxs,
  },
  companyName: {
    fontSize: FONT_SIZE.body,
    color: COLORS.primary,
    fontWeight: FONT_WEIGHT.medium,
    marginTop: SPACING.xxs,
  },
  errorText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.body,
    textAlign: 'center',
    marginTop: SPACING.xl,
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
  logoutButtonPressed: {
    opacity: 0.8,
  },
  logoutText: {
    color: COLORS.error,
    fontWeight: FONT_WEIGHT.semibold,
    fontSize: FONT_SIZE.body,
  },
});
