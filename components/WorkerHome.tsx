import { api } from '@/app/api/api';
import { AppText, Badge, Button, Card, SectionHeader, StatCard, type IconName, type TonoStat } from '@/components/ds';
import { useAuth } from '@/context/authContext';
import { SPACING, useEstilos, useTheme, type Tema } from '@/theme';
import { formatCurrency, toDateInputValue } from '@/utils/formatters';
import { logger } from '@/utils/logger';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, View } from 'react-native';

interface Resumen {
  realizados: number;
  aprobados: number;
  pendientes: number;
  rechazados: number;
  comisionAcum: number;
  propinasAcum: number;
  deducciones: number;
}

const VACIO: Resumen = {
  realizados: 0,
  aprobados: 0,
  pendientes: 0,
  rechazados: 0,
  comisionAcum: 0,
  propinasAcum: 0,
  deducciones: 0,
};

const crearEstilos = (t: Tema) => ({
  contenedor: { flex: 1, backgroundColor: t.colores.fondo },
  scroll: { padding: SPACING.lg, paddingBottom: SPACING.huge },
  saludo: { marginBottom: SPACING.lg },
  carga: { paddingVertical: SPACING.huge, alignItems: 'center' as const },
  grilla: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: SPACING.md, marginBottom: SPACING.lg },
  celda: { flexBasis: '47%' as const, flexGrow: 1, minWidth: 140 },
  fila: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'center' as const, paddingVertical: SPACING.sm, gap: SPACING.md },
  filaTexto: { flex: 1, minWidth: 0 },
  acciones: { flexDirection: 'row' as const, gap: SPACING.md },
  accion: { flex: 1, minWidth: 0 },
  aviso: { marginBottom: SPACING.lg, alignSelf: 'flex-start' as const },
});


export default function WorkerHome() {
  const { usuario, isDemo } = useAuth();
  const router = useRouter();
  const estilos = useEstilos(crearEstilos);
  const { tema } = useTheme();
  const c = tema.colores;
  const [data, setData] = useState<Resumen>(VACIO);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const cargar = useCallback(async () => {
    if (!usuario?.id) return;
    try {
      // Rango: últimos 60 días (cubre lo no liquidado del período actual)
      const hoy = new Date();
      const desde = new Date(hoy);
      desde.setDate(hoy.getDate() - 60);

      const params: any = {
        personaId: usuario.id,
        fechaInicio: new Date(toDateInputValue(desde) + 'T00:00:00').toISOString(),
        fechaFin: new Date(toDateInputValue(hoy) + 'T23:59:59').toISOString(),
      };

      const resReg = await api.get('/RegistroServicio/ObtenerRegistros', { params });
      const registros: any[] = Array.isArray(resReg.data) ? resReg.data : [];

      const hoyStr = toDateInputValue(hoy);
      let realizados = 0, aprobados = 0, pendientes = 0, rechazados = 0;
      let comisionAcum = 0, propinasAcum = 0;

      registros.forEach((r) => {
        const fechaStr = (r.fechaServicio || '').split('T')[0];
        const aprobado = (r.confirmado || r.liquidado) && !r.rechazado;

        // Resumen de HOY
        if (fechaStr === hoyStr) {
          realizados++;
          if (r.rechazado) rechazados++;
          else if (aprobado) aprobados++;
          else pendientes++;
        }

        // Comisión por cobrar: aprobada y aún no liquidada
        if (aprobado && !r.liquidado) {
          comisionAcum += Number(r.comision) || 0;
        }
        // Propinas pendientes: aprobadas y aún NO entregadas al trabajador
        if (aprobado && !r.propinaPagada) {
          propinasAcum += Number(r.propina) || 0;
        }
      });

      // Deducciones pendientes (best-effort; puede no estar disponible para el rol)
      let deducciones = 0;
      try {
        const resEg = await api.get('/EgresosEmpresa/ObtenerEgresosPorPersona', {
          params: { personaId: usuario.id },
        });
        const egresos: any[] = Array.isArray(resEg.data) ? resEg.data : [];
        deducciones = egresos
          .filter((e) => e.seDescuenta && !e.liquidado)
          .reduce((acc, e) => acc + (Number(e.valorEgreso) || 0), 0);
      } catch {
        deducciones = 0;
      }

      setData({ realizados, aprobados, pendientes, rechazados, comisionAcum, propinasAcum, deducciones });
    } catch (e) {
      logger.error('Error cargando resumen del trabajador:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [usuario?.id]);

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar])
  );

  const onRefresh = () => {
    setRefreshing(true);
    cargar();
  };

  const saldoEstimado = data.comisionAcum + data.propinasAcum - data.deducciones;

  const stats: { label: string; value: number; tone: TonoStat; icon: IconName }[] = [
    { label: 'Realizados', value: data.realizados, tone: 'primary', icon: 'clipboard-outline' },
    { label: 'Aprobados', value: data.aprobados, tone: 'success', icon: 'checkmark-circle-outline' },
    { label: 'Pendientes', value: data.pendientes, tone: 'info', icon: 'time-outline' },
    { label: 'Rechazados', value: data.rechazados, tone: 'error', icon: 'close-circle-outline' },
  ];

  const fila = (etiqueta: string, valor: string, color?: string) => (
    <View style={estilos.fila}>
      <AppText tono="suave" style={estilos.filaTexto}>
        {etiqueta}
      </AppText>
      <AppText variante="etiqueta" style={color ? { color } : undefined}>
        {valor}
      </AppText>
    </View>
  );

  return (
    <ScrollView
      style={estilos.contenedor}
      contentContainerStyle={estilos.scroll}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[c.primarioFuerte]} />}
    >
      <View style={estilos.saludo}>
        <AppText tono="suave">Hola,</AppText>
        <AppText variante="titulo">{usuario?.nombre?.split(' ')[0] || 'Trabajador'}</AppText>
      </View>

      {isDemo && (
        <View style={estilos.aviso}>
          <Badge label="Modo prueba: datos de demostración" tone="warning" dot={false} />
        </View>
      )}

      {loading ? (
        <View style={estilos.carga}>
          <ActivityIndicator size="large" color={c.primarioFuerte} />
        </View>
      ) : (
        <>
          <SectionHeader title="Mi producción de hoy" icon="stats-chart-outline" />
          <View style={estilos.grilla}>
            {stats.map((s) => (
              <StatCard
                key={s.label}
                style={estilos.celda}
                label={s.label}
                value={String(s.value)}
                icon={s.icon}
                tone={s.tone}
              />
            ))}
          </View>

          <SectionHeader
            title="Mi saldo"
            icon="wallet-outline"
            ayuda="Este valor se paga en la liquidación. Las propinas son 100% tuyas."
          />
          <Card>
            {fila('Comisión acumulada', formatCurrency(data.comisionAcum))}
            {fila('Propinas acumuladas', formatCurrency(data.propinasAcum), c.exitoTexto)}
            {fila(
              'Deducciones pendientes',
              data.deducciones > 0 ? `- ${formatCurrency(data.deducciones)}` : formatCurrency(0),
              data.deducciones > 0 ? c.errorTexto : undefined
            )}
          </Card>
          <StatCard
            variant="solid"
            icon="cash-outline"
            label="Saldo estimado a recibir"
            value={formatCurrency(saldoEstimado)}
            style={{ marginBottom: SPACING.xl }}
          />

          <Button
            title="Registrar servicio"
            icon="add"
            onPress={() => router.push('/(tabs)/registroServicio')}
            style={{ marginBottom: SPACING.md }}
          />
          <View style={estilos.acciones}>
            <View style={estilos.accion}>
              <Button
                title="Mis pagos"
                icon="receipt-outline"
                variant="secondary"
                onPress={() => router.push('/(tabs)/contabilidad')}
              />
            </View>
            <View style={estilos.accion}>
              <Button
                title="Histórico"
                icon="archive-outline"
                variant="secondary"
                onPress={() => router.push('/(tabs)/contabilidad/historico')}
              />
            </View>
          </View>
        </>
      )}
    </ScrollView>
  );
}
