import { Button, Icon, LoadingState, type IconName } from '@/components/ds';
import WorkerHome from '@/components/WorkerHome';
import {
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
import { isTrabajador, puedeRegistrarServicios } from '@/utils/roles';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useAuth } from '../../context/authContext';

type MenuItem = {
  title: string;
  route: string;
  icon: IconName;
  color: string;
  description?: string;
};

export default function Home() {
  const { usuario, logout, cargando, isDemo } = useAuth();
  const router = useRouter();
  const { tema } = useTheme();
  const estilos = useEstilos(crearEstilos);

  if (cargando) {
    return <LoadingState message="Cargando..." />;
  }

  if (!usuario) {
    return (
      <View style={estilos.container}>
        <Text style={estilos.errorText}>No hay usuario en sesión</Text>
      </View>
    );
  }

  const rol = usuario.rol;

  // El trabajador (rol 02) tiene su propio dashboard "Mi Producción / Mi Saldo"
  if (isTrabajador(rol)) {
    return <WorkerHome />;
  }

  // Menú según el rol del usuario
  let menuItems: MenuItem[] = puedeRegistrarServicios(rol)
    ? [
        {
          title: 'Registrar servicios',
          route: '../registroServicio',
          icon: 'clipboard',
          color: COLORES_MODULO.registrar,
          description: 'Nuevo registro de servicio',
        },
        {
          title: 'Mis Pagos',
          route: '../contabilidad',
          icon: 'receipt',
          color: COLORES_MODULO.personas,
          description: 'Ver pagos pendientes',
        },
        {
          title: 'Histórico',
          route: '../contabilidad/historico',
          icon: 'time',
          color: COLORES_MODULO.historico,
          description: 'Consultar historial de pagos',
        },
      ]
    : [
        {
          title: 'Personas',
          route: '../personas',
          icon: 'person-add',
          color: COLORES_MODULO.personas,
          description: 'Gestionar personas',
        },
        {
          title: 'Servicios',
          route: '../servicios',
          icon: 'construct',
          color: COLORES_MODULO.servicios,
          description: 'Administrar servicios',
        },
        {
          title: 'Config. Servicios',
          route: '../configuracionServicio',
          icon: 'options',
          color: COLORES_MODULO.configServicios,
          description: 'Porcentajes y comisiones',
        },
        {
          title: 'Configuración',
          route: '../configuracion',
          icon: 'settings',
          color: COLORES_MODULO.configuracion,
          description: 'Ajustes generales',
        },
        {
          title: 'Registrar',
          route: '../registroServicio',
          icon: 'clipboard',
          color: COLORES_MODULO.registrar,
          description: 'Nuevo registro de servicio',
        },
        {
          title: 'Pagos',
          route: '../contabilidad',
          icon: 'receipt',
          color: COLORES_MODULO.pagos,
          description: 'Ver pagos pendientes',
        },
      ];

  // Agregar Finanzas (dashboard) solo para admin
  if (rol === '01' || rol === '03') {
    menuItems = [
      ...menuItems,
      {
        title: 'Finanzas',
        route: '../finanzas',
        icon: 'pie-chart',
        color: COLORES_MODULO.finanzas,
        description: 'Ingresos, egresos y reportes',
      },
    ];
  }

  return (
    <View style={estilos.container}>
      <ScrollView contentContainerStyle={estilos.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header de bienvenida */}
        <View style={estilos.welcomeSection}>
          <Text style={estilos.welcomeText}>Bienvenido,</Text>
          <Text style={estilos.userName}>{usuario.nombre}</Text>
          <Text style={estilos.companyName}>{usuario.nombreEmpresa || 'Natural'}</Text>
        </View>

        {/* Banner de modo demo */}
        {isDemo && (
          <View style={estilos.demoBanner}>
            <Icon name="rocket-outline" size={20} color={tema.colores.avisoTexto} />
            <View style={estilos.demoTextos}>
              <Text style={estilos.demoBannerTitle}>Modo Demo</Text>
              <Text style={estilos.demoBannerText}>Datos de ejemplo: no se guarda nada</Text>
            </View>
          </View>
        )}

        {/* Grid de menú */}
        <View style={estilos.grid}>
          {menuItems.map((item, index) => (
            <Pressable
              key={index}
              accessibilityRole="button"
              accessibilityLabel={item.description ? `${item.title}. ${item.description}` : item.title}
              style={({ pressed }) => [estilos.menuCard, pressed && estilos.menuCardPressed]}
              onPress={() => router.push(item.route as any)}
            >
              <View style={[estilos.iconCircle, { backgroundColor: item.color }]}>
                <Icon name={item.icon} size={24} color={tema.colores.blanco} />
              </View>
              <Text style={estilos.menuTitle} numberOfLines={2}>
                {item.title}
              </Text>
              {item.description && (
                <Text style={estilos.menuDescription} numberOfLines={2}>
                  {item.description}
                </Text>
              )}
            </Pressable>
          ))}
        </View>

        {/* Cerrar sesión: acción discreta (no destructiva, por eso no va en rojo) */}
        <View style={estilos.logout}>
          <Button
            title="Cerrar sesión"
            icon="log-out-outline"
            variant="ghost"
            fullWidth={false}
            align="center"
            onPress={logout}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const crearEstilos = (t: Tema) => ({
  container: {
    flex: 1,
    backgroundColor: t.colores.fondo,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.huge,
  },
  welcomeSection: {
    marginBottom: SPACING.xl,
    paddingHorizontal: SPACING.xs,
  },
  welcomeText: {
    fontSize: FONT_SIZE.body,
    color: t.colores.textoSuave,
  },
  userName: {
    fontSize: FONT_SIZE.title1,
    fontWeight: FONT_WEIGHT.bold,
    color: t.colores.texto,
    marginTop: SPACING.xxs,
  },
  companyName: {
    fontSize: FONT_SIZE.body,
    color: t.colores.primarioTexto,
    fontWeight: FONT_WEIGHT.medium,
    marginTop: SPACING.xxs,
  },
  errorText: {
    color: t.colores.textoSuave,
    fontSize: FONT_SIZE.body,
    textAlign: 'center' as const,
    marginTop: SPACING.xl,
  },
  grid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    justifyContent: 'space-between' as const,
    gap: SPACING.md,
  },
  menuCard: {
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
  menuCardPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: RADIUS.round,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginBottom: SPACING.md,
    ...sombra(t, 'sm'),
  },
  menuTitle: {
    fontSize: FONT_SIZE.body,
    fontWeight: FONT_WEIGHT.semibold,
    color: t.colores.texto,
    textAlign: 'center' as const,
    marginBottom: SPACING.xxs,
  },
  menuDescription: {
    fontSize: FONT_SIZE.footnote,
    color: t.colores.textoSuave,
    textAlign: 'center' as const,
    lineHeight: 16,
  },
  demoBanner: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: t.colores.avisoSuave,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    gap: SPACING.md,
  },
  demoTextos: {
    flex: 1,
    minWidth: 0,
  },
  demoBannerTitle: {
    fontSize: FONT_SIZE.subhead,
    fontWeight: FONT_WEIGHT.semibold,
    color: t.colores.avisoTexto,
  },
  demoBannerText: {
    fontSize: FONT_SIZE.footnote,
    color: t.colores.avisoTexto,
    marginTop: 2,
  },
  logout: {
    marginTop: SPACING.xxl,
    alignItems: 'center' as const,
  },
});
