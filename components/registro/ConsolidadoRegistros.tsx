import { AppText, Badge, Card, Icon, SectionHeader } from '@/components/ds';
import { RADIUS, SPACING, useEstilos, useTheme, type Tema } from '@/theme';
import { View } from 'react-native';
import type { ConsolidadoPersona } from './tipos';

/** Resumen de servicios por persona según los filtros aplicados. Solo informativo. */
export function ConsolidadoRegistros({ consolidado }: { consolidado: ConsolidadoPersona[] }) {
  const estilos = useEstilos(crearEstilos);
  const { tema } = useTheme();

  return (
    <Card style={estilos.card}>
      <SectionHeader title="Consolidado" icon="stats-chart-outline" />
      {consolidado.length === 0 ? (
        <AppText tono="suave">No hay registros disponibles</AppText>
      ) : (
        <View style={estilos.grilla}>
          {consolidado.map((item, index) => {
            const totalServicios = item.servicios.reduce((sum, s) => sum + s.cantidad, 0);
            return (
              <View key={index} style={estilos.persona}>
                <View style={estilos.personaCabecera}>
                  <Icon name="person-outline" size={18} color={tema.colores.primarioTexto} />
                  <AppText variante="etiqueta" numberOfLines={1} style={estilos.personaNombre}>
                    {item.nombrePersona}
                  </AppText>
                  <Badge label={`${totalServicios} servicio(s)`} tone="primary" dot={false} size="sm" />
                </View>
                {item.servicios.map((servicio, sIndex) => (
                  <View key={sIndex} style={estilos.servicio}>
                    <AppText variante="nota" tono="suave" style={estilos.servicioNombre}>
                      {servicio.nombreServicio}
                    </AppText>
                    <AppText variante="etiqueta" tono="primario">
                      {servicio.cantidad}
                    </AppText>
                  </View>
                ))}
              </View>
            );
          })}
        </View>
      )}
    </Card>
  );
}

const crearEstilos = (t: Tema) => ({
  card: { marginBottom: SPACING.lg },
  // Una columna a 360 px; dos o más cuando hay espacio.
  grilla: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: SPACING.sm },
  persona: {
    flexGrow: 1,
    flexBasis: 240,
    minWidth: 0,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    backgroundColor: t.colores.fondoSuave,
  },
  personaCabecera: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: SPACING.sm, marginBottom: SPACING.xs },
  personaNombre: { flex: 1, minWidth: 0 },
  servicio: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: SPACING.sm,
    paddingVertical: SPACING.xs,
    paddingLeft: SPACING.xl + SPACING.xs,
  },
  servicioNombre: { flex: 1, minWidth: 0 },
});
