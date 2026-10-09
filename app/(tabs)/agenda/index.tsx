import { citasConfigurado, MENSAJE_CITAS_NO_CONFIGURADO } from '@/app/api/citasConfig';
import { ESTADOS_CITA } from '@/app/api/modelos/citas';
import ActivarAgenda from '@/components/citas/ActivarAgenda';
import EmptyState from '@/components/EmptyState';
import FilterChips from '@/components/FilterChips';
import ListCard from '@/components/ListCard';
import LoadingView from '@/components/LoadingView';
import PrimaryButton from '@/components/PrimaryButton';
import SimpleDatePicker from '@/components/SimpleDatePicker';
import StatusBadge from '@/components/StatusBadge';
import { COLORS, FONT_SIZE, FONT_WEIGHT, RADIUS, SPACING } from '@/constants/theme';
import { useAuth } from '@/context/authContext';
import { useAgendaPersonal } from '@/hooks/useAgendaPersonal';
import { useRole } from '@/hooks/useRole';
import { badgeEstadoCita, fechaDeCita, formatHora, hoyNegocio, ordenarCitas } from '@/utils/citas';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

const OPCIONES_ESTADO = [{ key: '', label: 'Todos' }, ...ESTADOS_CITA.map((e) => ({ key: e, label: e }))];

/** Agenda del personal de Natural (01/02/03) con su sesión normal. */
export default function AgendaPersonal() {
  const { isDemo } = useAuth();
  const { isAdmin } = useRole();
  const router = useRouter();
  const agenda = useAgendaPersonal();

  const [fecha, setFecha] = useState(hoyNegocio());
  const [todasLasFechas, setTodasLasFechas] = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [estado, setEstado] = useState('');
  const [empleado, setEmpleado] = useState('');

  const citasFiltradas = useMemo(() => {
    const lista = agenda.citas.filter((c) => {
      if (!todasLasFechas && fechaDeCita(c) !== fecha) return false;
      if (estado && c.estado !== estado) return false;
      if (empleado === 'mias') return c.idEmpleado === agenda.miUsuarioId;
      if (empleado) return String(c.idEmpleado) === empleado;
      return true;
    });
    return ordenarCitas(lista);
  }, [agenda.citas, agenda.miUsuarioId, fecha, todasLasFechas, estado, empleado]);

  if (!citasConfigurado) {
    return <EmptyState icon="🗓️" message="Agenda no disponible" subtitle={MENSAJE_CITAS_NO_CONFIGURADO} />;
  }
  if (isDemo) {
    return <EmptyState icon="🗓️" message="No disponible en modo demo" subtitle="La agenda de citas requiere una cuenta real." />;
  }
  if (agenda.estado === 'cargando') {
    return <LoadingView message="Cargando agenda..." fullScreen />;
  }
  if (agenda.estado === 'noActivada') {
    return (
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.tituloSeccion}>La agenda de citas no está activada</Text>
        {isAdmin ? (
          <ActivarAgenda
            descripcion="Actívala para que tu empresa aparezca a los clientes. Después sincroniza los servicios y el personal con Natural desde “Ajustes”."
            onActivada={() => {
              agenda.cargar();
              router.push('/agenda/ajustes');
            }}
          />
        ) : (
          <Text style={styles.texto}>Pide a un administrador que active la agenda de la empresa.</Text>
        )}
      </ScrollView>
    );
  }
  if (agenda.estado === 'error') {
    return <EmptyState icon="⚠️" message="No se pudo cargar la agenda" subtitle={agenda.error} actionLabel="Reintentar" onAction={agenda.cargar} />;
  }

  const opcionesEmpleado = isAdmin
    ? [{ key: '', label: 'Todos' }, ...agenda.empleados.map((e) => ({ key: String(e.id), label: e.nombreUsuario }))]
    : [{ key: '', label: 'Todas' }, { key: 'mias', label: 'Mis citas' }];

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={agenda.refrescando} onRefresh={agenda.refrescar} colors={[COLORS.primary]} />}
      >
        {isAdmin && (
          <View style={styles.acciones}>
            <PrimaryButton title="Nueva cita" size="small" onPress={() => router.push('/agenda/crear')} />
            <PrimaryButton title="Servicios" size="small" variant="ghost" onPress={() => router.push('/agenda/servicios')} />
            <PrimaryButton title="Ajustes" size="small" variant="ghost" onPress={() => router.push('/agenda/ajustes')} />
          </View>
        )}
        {!isAdmin && agenda.miUsuarioId != null && (
          <View style={styles.acciones}>
            <PrimaryButton title="Mi horario" size="small" variant="ghost" onPress={() => router.push('/agenda/horarios')} />
          </View>
        )}

        <View style={styles.filaFecha}>
          <Pressable style={styles.selectorFecha} onPress={() => setPickerVisible(true)}>
            <FontAwesome5 name="calendar-alt" size={14} color={COLORS.primary} />
            <Text style={styles.textoFecha}>{todasLasFechas ? 'Todas las fechas' : formatDate(fecha)}</Text>
          </Pressable>
          <Pressable onPress={() => setTodasLasFechas((v) => !v)}>
            <Text style={styles.enlace}>{todasLasFechas ? 'Ver un día' : 'Ver todas'}</Text>
          </Pressable>
        </View>

        <FilterChips label="Estado" options={OPCIONES_ESTADO} selected={estado} onSelect={setEstado} />
        <FilterChips label={isAdmin ? 'Atiende' : 'Mostrar'} options={opcionesEmpleado} selected={empleado} onSelect={setEmpleado} />

        {citasFiltradas.length === 0 ? (
          <EmptyState icon="🗓️" message="No hay citas" subtitle="No hay citas con estos filtros." />
        ) : (
          citasFiltradas.map((c) => (
            <ListCard
              key={c.idCita}
              title={`${formatHora(c.horaEstimadaCita)} · ${c.nombreCliente || 'Cliente'}`}
              subtitle={`${formatDate(fechaDeCita(c))} · Atiende: ${c.nombreEmpleado || '-'}`}
              description={`${c.servicios.map((s) => s.nombreServicio).filter(Boolean).join(', ') || 'Sin servicios'} · ${formatCurrency(c.valorTotal)}`}
              badges={<StatusBadge label={c.estado} type={badgeEstadoCita(c.estado)} />}
              onPress={() => router.push(`/agenda/${c.idCita}`)}
            />
          ))
        )}
      </ScrollView>

      <SimpleDatePicker
        visible={pickerVisible}
        value={fecha}
        onChange={(f) => {
          setFecha(f);
          setTodasLasFechas(false);
        }}
        onClose={() => setPickerVisible(false)}
        title="Fecha de la agenda"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: SPACING.lg, paddingBottom: SPACING.huge },
  acciones: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.lg },
  filaFecha: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.md },
  selectorFecha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
    backgroundColor: COLORS.primarySurface,
  },
  textoFecha: { fontSize: FONT_SIZE.body, color: COLORS.text, fontWeight: FONT_WEIGHT.medium },
  enlace: { fontSize: FONT_SIZE.subhead, color: COLORS.primary, fontWeight: FONT_WEIGHT.semibold },
  tituloSeccion: { fontSize: FONT_SIZE.title3, fontWeight: FONT_WEIGHT.bold, color: COLORS.text, marginBottom: SPACING.md },
  texto: { fontSize: FONT_SIZE.body, color: COLORS.textSecondary },
});
