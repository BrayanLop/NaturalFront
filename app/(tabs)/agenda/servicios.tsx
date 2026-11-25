import { citasPersonalApi, esAgendaNoActivada, mensajeErrorCitas } from '@/app/api/citasApi';
import type { ActualizarServicioRequest, ServicioCitas } from '@/app/api/modelos/citas';
import { Toggle } from '@/components/ds';
import EmptyState from '@/components/EmptyState';
import LoadingView from '@/components/LoadingView';
import PrimaryButton from '@/components/PrimaryButton';
import StatusBadge from '@/components/StatusBadge';
import { FONT_SIZE, FONT_WEIGHT, RADIUS, SPACING, useEstilos, type Tema } from '@/theme';
import { useRole } from '@/hooks/useRole';
import { formatCurrency } from '@/utils/formatters';
import { showError } from '@/utils/logger';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

/**
 * Servicios de la agenda (solo 01/03). Vienen de Natural por sincronización: aquí no se crean
 * ni se borran; solo se ajusta la duración (`tiempoEstimado`) y si se pueden agendar (`activo`).
 */
export default function ServiciosAgenda() {
  const estilos = useEstilos(crearEstilos);
  const { isAdmin } = useRole();
  const [servicios, setServicios] = useState<ServicioCitas[] | null>(null);
  const [error, setError] = useState('');

  const cargar = useCallback(async () => {
    try {
      const { data } = await citasPersonalApi.get<ServicioCitas[]>('/Servicios');
      setServicios(data ?? []);
      setError('');
    } catch (e) {
      setServicios([]);
      setError(
        esAgendaNoActivada(e)
          ? 'La agenda no está activada. Actívala desde “Ajustes”.'
          : mensajeErrorCitas(e, 'No se pudieron cargar los servicios.')
      );
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar])
  );

  if (!isAdmin) return <EmptyState message="Solo un administrador puede ajustar los servicios." />;
  if (servicios === null) return <LoadingView message="Cargando servicios..." fullScreen />;
  if (error) return <EmptyState message="No se pudieron cargar los servicios" subtitle={error} actionLabel="Reintentar" onAction={cargar} />;
  if (servicios.length === 0) {
    return (
      <EmptyState
       
        message="Aún no hay servicios"
        subtitle="Los servicios llegan desde Natural. Usa “Sincronizar con Natural” en Ajustes."
      />
    );
  }

  return (
    <ScrollView contentContainerStyle={estilos.scroll}>
      <Text style={estilos.ayuda}>
        Nombre y valor vienen de Natural. Ajusta cuánto dura cada servicio y si los clientes pueden agendarlo.
      </Text>
      {servicios.map((s) => (
        <FilaServicio
          key={s.idServicio}
          servicio={s}
          onGuardado={(act) => setServicios((prev) => (prev ?? []).map((x) => (x.idServicio === act.idServicio ? act : x)))}
        />
      ))}
    </ScrollView>
  );
}

function FilaServicio({ servicio, onGuardado }: { servicio: ServicioCitas; onGuardado: (s: ServicioCitas) => void }) {
  const estilos = useEstilos(crearEstilos);
  const [minutos, setMinutos] = useState(String(servicio.tiempoEstimado));
  const [activo, setActivo] = useState(servicio.activo);
  const [guardando, setGuardando] = useState(false);

  const cambios = Number(minutos) !== servicio.tiempoEstimado || activo !== servicio.activo;

  const guardar = async () => {
    const valor = Number(minutos);
    if (!Number.isInteger(valor) || valor <= 0) {
      showError('La duración debe ser un número entero de minutos mayor que cero.');
      return;
    }
    const cuerpo: ActualizarServicioRequest = {};
    if (valor !== servicio.tiempoEstimado) cuerpo.tiempoEstimado = valor;
    if (activo !== servicio.activo) cuerpo.activo = activo;
    setGuardando(true);
    try {
      await citasPersonalApi.put(`/Servicios/${servicio.idServicio}`, cuerpo);
      onGuardado({ ...servicio, tiempoEstimado: valor, activo, agendable: activo && servicio.disponibleEnNatural });
    } catch (e) {
      showError(mensajeErrorCitas(e, 'No se pudo guardar el servicio.'));
    } finally {
      setGuardando(false);
    }
  };

  return (
    <View style={estilos.card}>
      <View style={estilos.encabezado}>
        <Text style={estilos.nombre} numberOfLines={2}>{servicio.nombreServicio}</Text>
        <StatusBadge
          label={servicio.agendable ? 'Agendable' : 'No agendable'}
          type={servicio.agendable ? 'disponible' : 'info'}
        />
      </View>
      <Text style={estilos.detalle}>
        {formatCurrency(servicio.valor)}
        {!servicio.disponibleEnNatural ? ' · No disponible en Natural' : ''}
      </Text>

      <View style={estilos.fila}>
        <Text style={estilos.label}>Duración (min)</Text>
        <TextInput
          style={[estilos.campo, estilos.inputMinutos]}
          value={minutos}
          onChangeText={(t) => setMinutos(t.replace(/\D/g, ''))}
          keyboardType="number-pad"
          maxLength={4}
        />
      </View>
      <View style={estilos.fila}>
        <Text style={estilos.label}>Se puede agendar</Text>
        <Toggle value={activo} onValueChange={setActivo} accessibilityLabel="Se puede agendar" />
      </View>

      {cambios && <PrimaryButton title="Guardar" size="small" onPress={guardar} loading={guardando} disabled={guardando} />}
    </View>
  );
}

const crearEstilos = (t: Tema) => StyleSheet.create({
  campo: { minHeight: 48, borderWidth: 1, borderColor: t.colores.borde, borderRadius: RADIUS.lg, paddingHorizontal: SPACING.md, backgroundColor: t.colores.superficie, color: t.colores.texto, fontSize: FONT_SIZE.callout },
  scroll: { padding: SPACING.lg, paddingBottom: SPACING.huge, backgroundColor: t.colores.fondo, flexGrow: 1 },
  ayuda: { fontSize: FONT_SIZE.subhead, color: t.colores.textoSuave, marginBottom: SPACING.lg },
  card: {
    backgroundColor: t.colores.superficie,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: t.colores.borde,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  encabezado: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: SPACING.sm },
  nombre: { flex: 1, fontSize: FONT_SIZE.headline, fontWeight: FONT_WEIGHT.semibold, color: t.colores.texto },
  detalle: { fontSize: FONT_SIZE.footnote, color: t.colores.textoSuave },
  fila: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label: { fontSize: FONT_SIZE.body, color: t.colores.texto },
  inputMinutos: { width: 90, textAlign: 'center' },
});
