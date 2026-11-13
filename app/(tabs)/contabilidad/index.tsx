import { AppText, Badge, Card, Divider, EmptyState, Icon, IconButton, LoadingState } from '@/components/ds';
import { useAuth } from '@/context/authContext';
import { SPACING, useEstilos, useTheme, type Tema } from '@/theme';
import { formatCurrency } from '@/utils/formatters';
import { logger } from '@/utils/logger';
import { isTrabajador } from '@/utils/roles';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, View } from 'react-native';
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

const crearEstilos = (t: Tema) => ({
  contenedor: { flex: 1, padding: SPACING.lg, backgroundColor: t.colores.fondo },
  cabecera: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginBottom: SPACING.lg,
  },
  cabeceraTexto: { flex: 1, minWidth: 0, marginRight: SPACING.md },
  lista: { paddingBottom: SPACING.huge },
  tarjeta: { marginBottom: SPACING.lg },
  filaPersona: { flexDirection: 'row' as const, alignItems: 'center' as const, marginBottom: SPACING.md },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: t.colores.primarioSuave,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: SPACING.md,
  },
  nombre: { flex: 1, minWidth: 0 },
  totales: { flexDirection: 'row' as const, gap: SPACING.sm, marginBottom: SPACING.md },
  totalCaja: { flex: 1, minWidth: 0 },
  etiquetaServicios: { textTransform: 'uppercase' as const, letterSpacing: 0.6, marginBottom: SPACING.xs },
  filaServicio: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: t.colores.divisor,
  },
  servicioNombre: { flex: 1, minWidth: 0, marginRight: SPACING.sm },
});

export default function PagosPorPersona() {
  const { usuario } = useAuth();
  const router = useRouter();
  const estilos = useEstilos(crearEstilos);
  const { tema } = useTheme();
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
    <View style={estilos.contenedor}>
      <View style={estilos.cabecera}>
        <View style={estilos.cabeceraTexto}>
          <AppText variante="subtitulo">Pagos recientes</AppText>
          <AppText variante="nota" tono="suave">
            {pagos.length} persona{pagos.length !== 1 ? 's' : ''} con pagos
          </AppText>
        </View>
        <IconButton
          icon="calendar-outline"
          variant="soft"
          accessibilityLabel="Ver histórico de pagos"
          onPress={() => router.push('/contabilidad/historico')}
        />
      </View>

      {loading ? (
        <LoadingState message="Cargando pagos..." />
      ) : pagos.length === 0 ? (
        <EmptyState
          icon="receipt-outline"
          title="No hay pagos recientes"
          subtitle="Los pagos aparecerán aquí cuando se registren"
        />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={estilos.lista}>
          {pagos.map((pago, index) => (
            <Card
              key={index}
              style={estilos.tarjeta}
              accessibilityLabel={`Ver detalle de ${pago.nombrePersona}`}
              onPress={() => router.push(`/contabilidad/detalleServicioPersona/${pago.personaId}` as any)}
            >
              <View style={estilos.filaPersona}>
                <View style={estilos.avatar}>
                  <Icon name="person-outline" size={20} color={tema.colores.primarioTexto} />
                </View>
                <AppText variante="subtitulo" style={estilos.nombre} numberOfLines={1}>
                  {pago.nombrePersona}
                </AppText>
                {pago.totalSinConfirmar > 0 ? <Badge label="Pendiente" tone="warning" size="sm" /> : null}
              </View>

              <View style={estilos.totales}>
                <Card variant="tinted" style={estilos.totalCaja}>
                  <AppText variante="nota" tono="primario">
                    Total pagado
                  </AppText>
                  <AppText variante="numero" tono="primario" numberOfLines={1} adjustsFontSizeToFit>
                    {formatCurrency(pago.totalPagado)}
                  </AppText>
                </Card>
                {pago.totalSinConfirmar > 0 ? (
                  <Card style={estilos.totalCaja}>
                    <AppText variante="nota" tono="suave">
                      Sin confirmar
                    </AppText>
                    <AppText variante="numero" tono="aviso" numberOfLines={1} adjustsFontSizeToFit>
                      {formatCurrency(pago.totalSinConfirmar)}
                    </AppText>
                  </Card>
                ) : null}
              </View>

              <Divider />
              <AppText variante="nota" tono="suave" style={estilos.etiquetaServicios}>
                Servicios realizados
              </AppText>
              {pago.servicios.map((servicio, idx) => (
                <View key={idx} style={estilos.filaServicio}>
                  <AppText variante="cuerpo" style={estilos.servicioNombre} numberOfLines={2}>
                    {servicio.nombre}
                  </AppText>
                  <Badge label={String(servicio.cantidad)} tone="primary" dot={false} size="sm" />
                </View>
              ))}
            </Card>
          ))}
        </ScrollView>
      )}
    </View>
  );
}
