import { COLORS, FONT_SIZE, FONT_WEIGHT, RADIUS, SHADOWS, SPACING } from '@/constants/theme';
import { useAuth } from '@/context/authContext';
import { formatCurrency } from '@/utils/formatters';
import { logger } from '@/utils/logger';
import { isTrabajador } from '@/utils/roles';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { Link, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { api } from '../../api/api';

type ServicioRealizado = {
  nombre: string;
  cantidad: number;
};

type PagoPersona = {
  personaId: number;
  nombrePersona: string;
  totalPagado: number;
  totalSinConfirmar: number;
  servicios: ServicioRealizado[];
};

export default function PagosPorPersona() {
  const { usuario } = useAuth();
  const [pagos, setPagos] = useState<PagoPersona[]>([]);
  const [loading, setLoading] = useState(false);

  const cargarPagos = async () => {
    setLoading(true);
    try {
      // Si es rol '02' (trabajador), enviar personaId para filtrar en el backend
      const params: Record<string, unknown> = {};
      if (isTrabajador(usuario?.rol) && usuario?.id) {
        params.personaId = usuario.id;
      }
      
      const response = await api.get('Contabilidad/PagosUltimosDias', { params });
      setPagos(response.data);
    } catch (error) {
      logger.error('Error al cargar pagos:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      cargarPagos();
    }, [])
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Contabilidad</Text>
          <Text style={styles.headerSubtitle}>
            {pagos.length} persona{pagos.length !== 1 ? 's' : ''} con pagos recientes
          </Text>
        </View>
        <Link href="/contabilidad/historico" asChild>
          <Pressable style={({ pressed }) => [
            styles.headerActionButton,
            pressed && styles.headerActionButtonPressed,
          ]}>
            <FontAwesome5 name="calendar-alt" size={16} color={COLORS.primary} />
          </Pressable>
        </Link>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Cargando pagos...</Text>
        </View>
      ) : pagos.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <FontAwesome5 name="chart-bar" size={48} color={COLORS.primary} />
          </View>
          <Text style={styles.emptyTitle}>No hay pagos recientes</Text>
          <Text style={styles.emptySubtitle}>Los pagos aparecerán aquí cuando se registren</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {pagos.map((pago, index) => (
          <Link
              key={index}
              href={`/contabilidad/detalleServicioPersona/${pago.personaId}`}
              asChild
            >
              <Pressable style={({ pressed }) => [
                styles.card,
                pressed && styles.cardPressed,
              ]}>
                <View style={styles.cardHeader}>
                  <View style={styles.personaInfo}>
                    <View style={styles.avatarContainer}>
                      <FontAwesome5 name="user" size={16} color={COLORS.primary} />
                    </View>
                    <Text style={styles.nombre}>{pago.nombrePersona}</Text>
                  </View>
                  {pago.totalSinConfirmar > 0 && (
                    <View style={styles.pendingBadge}>
                      <Text style={styles.pendingBadgeText}>Pendiente</Text>
                    </View>
                  )}
                </View>
                
                <View style={styles.totalesContainer}>
                  <View style={styles.totalBox}>
                    <Text style={styles.totalLabel}>Total pagado</Text>
                    <Text style={styles.totalMonto}>{formatCurrency(pago.totalPagado)}</Text>
                  </View>
                  {pago.totalSinConfirmar > 0 && (
                    <View style={styles.sinConfirmarBox}>
                      <Text style={styles.sinConfirmarLabel}>Sin confirmar</Text>
                      <Text style={styles.sinConfirmarMonto}>{formatCurrency(pago.totalSinConfirmar)}</Text>
                    </View>
                  )}
                </View>
                
                <View style={styles.serviciosContainer}>
                  <Text style={styles.serviciosTitle}>Servicios realizados</Text>
                  {pago.servicios.map((servicio, idx) => (
                    <View key={idx} style={styles.servicioItem}>
                      <View style={styles.servicioIndicador} />
                      <Text style={styles.servicioNombre}>{servicio.nombre}</Text>
                      <Text style={styles.servicioCantidad}>{servicio.cantidad}</Text>
                    </View>
                  ))}
                </View>
              </Pressable>
          </Link>))}
        </ScrollView>)}
    </View>);
  }

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: SPACING.lg, 
    backgroundColor: COLORS.background 
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  headerActionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primarySurface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  headerActionButtonPressed: {
    backgroundColor: COLORS.primary,
    transform: [{ scale: 0.95 }],
  },
  historicoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.lg,
    ...SHADOWS.primary,
  },
  historicoButtonPressed: {
    backgroundColor: COLORS.primaryDark,
    transform: [{ scale: 0.98 }],
  },
  historicoText: { 
    color: COLORS.white, 
    fontWeight: FONT_WEIGHT.semibold, 
    fontSize: FONT_SIZE.md 
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.md,
  },
  loadingText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xxl,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primarySurface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  emptyTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  emptySubtitle: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  card: {
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.md,
  },
  cardPressed: {
    backgroundColor: COLORS.surface,
    transform: [{ scale: 0.99 }],
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  personaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: SPACING.sm,
  },
  avatarContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primarySurface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nombre: { 
    fontSize: FONT_SIZE.md, 
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.text,
    flex: 1,
  },
  pendingBadge: {
    backgroundColor: COLORS.warningLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.warning,
  },
  pendingBadgeText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.warning,
  },
  totalesContainer: { 
    flexDirection: 'row', 
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  totalBox: {
    flex: 1,
    backgroundColor: COLORS.primarySurface,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  totalLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
    fontWeight: FONT_WEIGHT.medium,
  },
  totalMonto: {
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.primary,
  },
  sinConfirmarBox: {
    flex: 1,
    backgroundColor: COLORS.warningLight,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.warning,
  },
  sinConfirmarLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
    fontWeight: FONT_WEIGHT.medium,
  },
  sinConfirmarMonto: {
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.warning,
  },
  serviciosContainer: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.md,
  },
  serviciosTitle: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  servicioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.sm,
    marginBottom: SPACING.xs,
  },
  servicioIndicador: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
    marginRight: SPACING.sm,
  },
  servicioNombre: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.text,
    flex: 1,
  },
  servicioCantidad: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.primary,
    minWidth: 30,
    textAlign: 'right',
  },
});
