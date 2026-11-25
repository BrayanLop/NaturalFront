import StatusBadge from '@/components/StatusBadge';
import type { Cita } from '@/app/api/modelos/citas';
import { FONT_SIZE, FONT_WEIGHT, RADIUS, SPACING, useEstilos, type Tema } from '@/theme';
import { badgeEstadoCita, formatDuracion, formatFechaHoraCita } from '@/utils/citas';
import { formatCurrency } from '@/utils/formatters';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

/** Ficha de una cita: fecha, personas, servicios y totales. */
export default function DetalleCitaView({ cita, mostrarCliente = true }: { cita: Cita; mostrarCliente?: boolean }) {
  const estilos = useEstilos(crearEstilos);
  return (
    <View style={estilos.card}>
      <View style={estilos.encabezado}>
        <Text style={estilos.titulo}>Cita #{cita.idCita}</Text>
        <StatusBadge label={cita.estado} type={badgeEstadoCita(cita.estado)} />
      </View>

      <Fila label="Fecha y hora" valor={formatFechaHoraCita(cita)} />
      {mostrarCliente && <Fila label="Cliente" valor={cita.nombreCliente || `#${cita.idCliente}`} />}
      <Fila label="Atiende" valor={cita.nombreEmpleado || `#${cita.idEmpleado}`} />
      {cita.observaciones ? <Fila label="Observaciones" valor={cita.observaciones} /> : null}

      <Text style={estilos.seccion}>Servicios</Text>
      {cita.servicios.length === 0 ? (
        <Text style={estilos.vacio}>Sin servicios asociados.</Text>
      ) : (
        cita.servicios.map((s) => (
          <View key={s.idServicio} style={estilos.servicio}>
            <Text style={estilos.servicioNombre}>{s.nombreServicio || `Servicio #${s.idServicio}`}</Text>
            <Text style={estilos.servicioDetalle}>
              {formatDuracion(s.tiempoEstimado)} · {formatCurrency(s.valorServicio)}
            </Text>
          </View>
        ))
      )}

      <View style={estilos.divisor} />
      <Fila label="Duración total" valor={formatDuracion(cita.duracionTotal)} />
      <Fila label="Valor total" valor={formatCurrency(cita.valorTotal)} destacado />
    </View>
  );
}

function Fila({ label, valor, destacado }: { label: string; valor: string; destacado?: boolean }) {
  const estilos = useEstilos(crearEstilos);
  return (
    <View style={estilos.fila}>
      <Text style={estilos.label}>{label}</Text>
      <Text style={[estilos.valor, destacado && estilos.valorDestacado]}>{valor}</Text>
    </View>
  );
}

const crearEstilos = (t: Tema) => StyleSheet.create({
  card: {
    backgroundColor: t.colores.superficie,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: t.colores.borde,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  encabezado: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  titulo: { fontSize: FONT_SIZE.title3, fontWeight: FONT_WEIGHT.bold, color: t.colores.texto },
  fila: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: SPACING.xs, gap: SPACING.md },
  label: { fontSize: FONT_SIZE.body, color: t.colores.textoSuave },
  valor: { fontSize: FONT_SIZE.body, color: t.colores.texto, fontWeight: FONT_WEIGHT.medium, flexShrink: 1, textAlign: 'right' },
  valorDestacado: { color: t.colores.primario, fontWeight: FONT_WEIGHT.bold, fontSize: FONT_SIZE.headline },
  seccion: { fontSize: FONT_SIZE.subhead, fontWeight: FONT_WEIGHT.semibold, color: t.colores.texto, marginTop: SPACING.md, marginBottom: SPACING.sm },
  vacio: { fontSize: FONT_SIZE.subhead, color: t.colores.textoSuave },
  servicio: { paddingVertical: SPACING.xs },
  servicioNombre: { fontSize: FONT_SIZE.body, color: t.colores.texto },
  servicioDetalle: { fontSize: FONT_SIZE.footnote, color: t.colores.textoSuave },
  divisor: { height: 1, backgroundColor: t.colores.divisor, marginVertical: SPACING.md },
});
