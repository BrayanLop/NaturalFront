import StatusBadge from '@/components/StatusBadge';
import type { Cita } from '@/app/api/modelos/citas';
import { COLORS, FONT_SIZE, FONT_WEIGHT, RADIUS, SPACING } from '@/constants/theme';
import { badgeEstadoCita, formatDuracion, formatFechaHoraCita } from '@/utils/citas';
import { formatCurrency } from '@/utils/formatters';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

/** Ficha de una cita: fecha, personas, servicios y totales. */
export default function DetalleCitaView({ cita, mostrarCliente = true }: { cita: Cita; mostrarCliente?: boolean }) {
  return (
    <View style={styles.card}>
      <View style={styles.encabezado}>
        <Text style={styles.titulo}>Cita #{cita.idCita}</Text>
        <StatusBadge label={cita.estado} type={badgeEstadoCita(cita.estado)} />
      </View>

      <Fila label="Fecha y hora" valor={formatFechaHoraCita(cita)} />
      {mostrarCliente && <Fila label="Cliente" valor={cita.nombreCliente || `#${cita.idCliente}`} />}
      <Fila label="Atiende" valor={cita.nombreEmpleado || `#${cita.idEmpleado}`} />
      {cita.observaciones ? <Fila label="Observaciones" valor={cita.observaciones} /> : null}

      <Text style={styles.seccion}>Servicios</Text>
      {cita.servicios.length === 0 ? (
        <Text style={styles.vacio}>Sin servicios asociados.</Text>
      ) : (
        cita.servicios.map((s) => (
          <View key={s.idServicio} style={styles.servicio}>
            <Text style={styles.servicioNombre}>{s.nombreServicio || `Servicio #${s.idServicio}`}</Text>
            <Text style={styles.servicioDetalle}>
              {formatDuracion(s.tiempoEstimado)} · {formatCurrency(s.valorServicio)}
            </Text>
          </View>
        ))
      )}

      <View style={styles.divisor} />
      <Fila label="Duración total" valor={formatDuracion(cita.duracionTotal)} />
      <Fila label="Valor total" valor={formatCurrency(cita.valorTotal)} destacado />
    </View>
  );
}

function Fila({ label, valor, destacado }: { label: string; valor: string; destacado?: boolean }) {
  return (
    <View style={styles.fila}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.valor, destacado && styles.valorDestacado]}>{valor}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  encabezado: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  titulo: { fontSize: FONT_SIZE.title3, fontWeight: FONT_WEIGHT.bold, color: COLORS.text },
  fila: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: SPACING.xs, gap: SPACING.md },
  label: { fontSize: FONT_SIZE.body, color: COLORS.textSecondary },
  valor: { fontSize: FONT_SIZE.body, color: COLORS.text, fontWeight: FONT_WEIGHT.medium, flexShrink: 1, textAlign: 'right' },
  valorDestacado: { color: COLORS.primary, fontWeight: FONT_WEIGHT.bold, fontSize: FONT_SIZE.headline },
  seccion: { fontSize: FONT_SIZE.subhead, fontWeight: FONT_WEIGHT.semibold, color: COLORS.text, marginTop: SPACING.md, marginBottom: SPACING.sm },
  vacio: { fontSize: FONT_SIZE.subhead, color: COLORS.textSecondary },
  servicio: { paddingVertical: SPACING.xs },
  servicioNombre: { fontSize: FONT_SIZE.body, color: COLORS.text },
  servicioDetalle: { fontSize: FONT_SIZE.footnote, color: COLORS.textSecondary },
  divisor: { height: 1, backgroundColor: COLORS.divider, marginVertical: SPACING.md },
});
