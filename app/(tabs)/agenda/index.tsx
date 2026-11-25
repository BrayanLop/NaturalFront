import { citasConfigurado, MENSAJE_CITAS_NO_CONFIGURADO } from '@/app/api/citasConfig';
import ActivarAgenda from '@/components/citas/ActivarAgenda';
import { Badge, Button, ChipGroup, EmptyState, IconButton, ListRow, LoadingState, SectionHeader } from '@/components/ds';
import SimpleDatePicker from '@/components/SimpleDatePicker';
import { useAuth } from '@/context/authContext';
import { useAgendaPersonal } from '@/hooks/useAgendaPersonal';
import { useRole } from '@/hooks/useRole';
import { FONT_SIZE, FONT_WEIGHT, RADIUS, SPACING, useEstilos, useTheme, type Tema } from '@/theme';
import { diaSemana, etiquetaDia, fechaDeCita, formatHora, hoyNegocio, ordenarCitas, sumarDias } from '@/utils/citas';
import { formatCurrency } from '@/utils/formatters';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

const INICIALES_DIA = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
const TONO_ESTADO = { Pendiente: 'warning', Confirmada: 'success', Atendida: 'info', Cancelada: 'error' } as const;

/** Lunes de la semana de `fecha` (YYYY-MM-DD). */
function lunesDe(fecha: string): string {
  const dia = diaSemana(fecha); // 0 = domingo
  return sumarDias(fecha, dia === 0 ? -6 : 1 - dia);
}

const crearEstilos = (t: Tema) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: t.colores.fondo },
    scroll: { padding: SPACING.lg, paddingBottom: SPACING.huge, flexGrow: 1 },
    titulo: { fontSize: FONT_SIZE.title3, fontWeight: FONT_WEIGHT.bold, color: t.colores.texto, marginBottom: SPACING.md },
    texto: { fontSize: FONT_SIZE.callout, color: t.colores.textoSuave },
    acciones: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.lg },
    semanaCab: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.sm },
    semanaTitulo: { flex: 1, textAlign: 'center', fontSize: FONT_SIZE.callout, fontWeight: FONT_WEIGHT.semibold, color: t.colores.texto },
    semana: { flexDirection: 'row', gap: SPACING.xs, marginBottom: SPACING.lg },
    dia: {
      flex: 1,
      minWidth: 0,
      minHeight: 64,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      borderColor: t.colores.borde,
      backgroundColor: t.colores.superficie,
    },
    diaActivo: { backgroundColor: t.colores.primarioFuerte, borderColor: t.colores.primarioFuerte },
    diaInicial: { fontSize: FONT_SIZE.caption, color: t.colores.textoSuave, fontWeight: FONT_WEIGHT.medium },
    diaNumero: { fontSize: FONT_SIZE.headline, color: t.colores.texto, fontWeight: FONT_WEIGHT.bold },
    diaTextoActivo: { color: t.colores.sobrePrimario },
    punto: { width: 6, height: 6, borderRadius: 3, marginTop: 3, backgroundColor: t.colores.primario },
    puntoActivo: { backgroundColor: t.colores.sobrePrimario },
    sinPunto: { width: 6, height: 6, marginTop: 3 },
    enlaceFila: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: SPACING.sm },
    enlace: { fontSize: FONT_SIZE.subhead, color: t.colores.primarioTexto, fontWeight: FONT_WEIGHT.semibold },
  });

/**
 * Agenda del personal de Natural (01/02/03) con su sesión normal: semana navegable, citas del
 * día ordenadas por hora, filtro por quien atiende y acceso rápido a "Nueva cita".
 */
export default function AgendaPersonal() {
  const estilos = useEstilos(crearEstilos);
  const { tema } = useTheme();
  const { isDemo } = useAuth();
  const { isAdmin } = useRole();
  const router = useRouter();
  const agenda = useAgendaPersonal();

  const [fecha, setFecha] = useState(hoyNegocio());
  const [pickerVisible, setPickerVisible] = useState(false);
  const [empleado, setEmpleado] = useState('');

  const semana = useMemo(() => {
    const lunes = lunesDe(fecha);
    return Array.from({ length: 7 }, (_, i) => sumarDias(lunes, i));
  }, [fecha]);

  // Citas vigentes por día (para marcar la semana) y citas del día elegido.
  const visiblesPorEmpleado = useMemo(
    () =>
      agenda.citas.filter((c) => {
        if (empleado === 'mias') return c.idEmpleado === agenda.miUsuarioId;
        if (empleado) return String(c.idEmpleado) === empleado;
        return true;
      }),
    [agenda.citas, agenda.miUsuarioId, empleado]
  );
  const diasConCitas = useMemo(
    () => new Set(visiblesPorEmpleado.filter((c) => c.estado !== 'Cancelada').map(fechaDeCita)),
    [visiblesPorEmpleado]
  );
  const citasDelDia = useMemo(
    () => ordenarCitas(visiblesPorEmpleado.filter((c) => fechaDeCita(c) === fecha)),
    [visiblesPorEmpleado, fecha]
  );

  if (!citasConfigurado) {
    return <EmptyState icon="calendar-outline" title="Agenda no disponible" subtitle={MENSAJE_CITAS_NO_CONFIGURADO} />;
  }
  if (isDemo) {
    return <EmptyState icon="calendar-outline" title="No disponible en modo demo" subtitle="La agenda de citas requiere una cuenta real." />;
  }
  if (agenda.estado === 'cargando') return <LoadingState message="Cargando agenda..." />;
  if (agenda.estado === 'noActivada') {
    return (
      <ScrollView style={estilos.container} contentContainerStyle={estilos.scroll}>
        <Text style={estilos.titulo}>La agenda de citas no está activada</Text>
        {isAdmin ? (
          <ActivarAgenda
            descripcion="Actívala para que tu empresa aparezca a los clientes. Después sincroniza los servicios y el personal con Natural desde “Ajustes”."
            onActivada={() => {
              agenda.cargar();
              router.push('/agenda/ajustes' as never);
            }}
          />
        ) : (
          <Text style={estilos.texto}>Pide a un administrador que active la agenda de la empresa.</Text>
        )}
      </ScrollView>
    );
  }
  if (agenda.estado === 'error') {
    return (
      <EmptyState
        icon="alert-circle-outline"
        title="No se pudo cargar la agenda"
        subtitle={agenda.error}
        actionLabel="Reintentar"
        onAction={agenda.cargar}
      />
    );
  }

  const opcionesEmpleado = isAdmin
    ? [{ key: '', label: 'Todos' }, ...agenda.empleados.map((e) => ({ key: String(e.id), label: e.nombreUsuario }))]
    : [
        { key: '', label: 'Todas' },
        { key: 'mias', label: 'Mis citas' },
      ];
  const hoy = hoyNegocio();

  return (
    <View style={estilos.container}>
      <ScrollView
        contentContainerStyle={estilos.scroll}
        refreshControl={<RefreshControl refreshing={agenda.refrescando} onRefresh={agenda.refrescar} colors={[tema.colores.primario]} />}
      >
        <View style={estilos.acciones}>
          {agenda.miUsuarioId != null && (
            <Button title="Google Calendar" icon="logo-google" size="sm" variant="secondary" fullWidth={false} onPress={() => router.push('/agenda/google' as never)} />
          )}
          {isAdmin ? (
            <>
              <Button title="Nueva cita" icon="add" size="sm" fullWidth={false} onPress={() => router.push('/agenda/crear' as never)} />
              <Button title="Servicios" icon="briefcase-outline" size="sm" variant="secondary" fullWidth={false} onPress={() => router.push('/agenda/servicios' as never)} />
              <Button title="Ajustes" icon="settings-outline" size="sm" variant="secondary" fullWidth={false} onPress={() => router.push('/agenda/ajustes' as never)} />
            </>
          ) : (
            agenda.miUsuarioId != null && (
              <Button title="Mi horario" icon="time-outline" size="sm" variant="secondary" fullWidth={false} onPress={() => router.push('/agenda/horarios' as never)} />
            )
          )}
        </View>

        <View style={estilos.semanaCab}>
          <IconButton icon="chevron-back" accessibilityLabel="Semana anterior" onPress={() => setFecha(sumarDias(fecha, -7))} />
          <Pressable onPress={() => setPickerVisible(true)} accessibilityRole="button" accessibilityLabel="Elegir fecha" style={{ flex: 1 }}>
            <Text style={estilos.semanaTitulo}>{etiquetaDia(fecha)}</Text>
          </Pressable>
          <IconButton icon="chevron-forward" accessibilityLabel="Semana siguiente" onPress={() => setFecha(sumarDias(fecha, 7))} />
        </View>

        <View style={estilos.semana}>
          {semana.map((d) => {
            const activo = d === fecha;
            return (
              <Pressable
                key={d}
                onPress={() => setFecha(d)}
                accessibilityRole="button"
                accessibilityLabel={etiquetaDia(d)}
                style={[estilos.dia, activo && estilos.diaActivo]}
              >
                <Text style={[estilos.diaInicial, activo && estilos.diaTextoActivo]}>{INICIALES_DIA[diaSemana(d)]}</Text>
                <Text style={[estilos.diaNumero, activo && estilos.diaTextoActivo]}>{Number(d.slice(8, 10))}</Text>
                <View style={diasConCitas.has(d) ? [estilos.punto, activo && estilos.puntoActivo] : estilos.sinPunto} />
              </Pressable>
            );
          })}
        </View>

        {fecha !== hoy && (
          <View style={estilos.enlaceFila}>
            <Pressable onPress={() => setFecha(hoy)} hitSlop={8} accessibilityRole="button">
              <Text style={estilos.enlace}>Ir a hoy</Text>
            </Pressable>
          </View>
        )}

        <ChipGroup label={isAdmin ? 'Atiende' : 'Mostrar'} options={opcionesEmpleado} value={empleado} onChange={setEmpleado} />

        <SectionHeader title={`${citasDelDia.length} cita${citasDelDia.length === 1 ? '' : 's'} · ${etiquetaDia(fecha)}`} icon="calendar-outline" />
        {citasDelDia.length === 0 ? (
          <EmptyState icon="calendar-clear-outline" title="Sin citas este día" subtitle="Cambia de día o de persona para ver más." />
        ) : (
          citasDelDia.map((c) => (
            <ListRow
              key={c.idCita}
              title={`${formatHora(c.horaEstimadaCita)} · ${c.nombreCliente || 'Cliente'}`}
              subtitle={`${c.servicios.map((s) => s.nombreServicio).filter(Boolean).join(', ') || 'Sin servicios'} · ${formatCurrency(c.valorTotal)}\nAtiende: ${c.nombreEmpleado || '-'}`}
              icon="time-outline"
              badge={<Badge label={c.estado} tone={TONO_ESTADO[c.estado as keyof typeof TONO_ESTADO] ?? 'neutral'} />}
              chevron
              onPress={() => router.push(`/agenda/${c.idCita}` as never)}
            />
          ))
        )}
      </ScrollView>

      <SimpleDatePicker visible={pickerVisible} value={fecha} onChange={setFecha} onClose={() => setPickerVisible(false)} title="Ir a la fecha" />
    </View>
  );
}
