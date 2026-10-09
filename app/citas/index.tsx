import { citasClienteApi, mensajeErrorCitas } from '@/app/api/citasApi';
import type { Cita } from '@/app/api/modelos/citas';
import DetalleCitaView from '@/components/citas/DetalleCitaView';
import EmptyState from '@/components/EmptyState';
import FilterChips from '@/components/FilterChips';
import LoadingView from '@/components/LoadingView';
import PrimaryButton from '@/components/PrimaryButton';
import { COLORS, FONT_SIZE, FONT_WEIGHT, SPACING } from '@/constants/theme';
import { useCitasAuth } from '@/context/citasAuthContext';
import { fechaDeCita, ordenarCitas } from '@/utils/citas';
import { toDateInputValue } from '@/utils/formatters';
import { showConfirm, showError } from '@/utils/logger';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

const FILTROS = [
  { key: 'proximas', label: 'Próximas' },
  { key: 'todas', label: 'Todas' },
];

/** "Mis citas" del cliente: listado, cancelar y accesos a agendar / catálogo. */
export default function MisCitas() {
  const { session, cambiarEmpresa } = useCitasAuth();
  const router = useRouter();
  const [citas, setCitas] = useState<Cita[] | null>(null);
  const [error, setError] = useState('');
  const [filtro, setFiltro] = useState('proximas');
  const [refrescando, setRefrescando] = useState(false);
  const [cancelando, setCancelando] = useState<number | null>(null);

  const cargar = useCallback(async () => {
    try {
      // El backend devuelve solo las citas del cliente del token.
      const { data } = await citasClienteApi.get<Cita[]>('/Citas');
      setCitas(data ?? []);
      setError('');
    } catch (e) {
      setCitas([]);
      setError(mensajeErrorCitas(e, 'No se pudieron cargar tus citas.'));
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar])
  );

  const visibles = useMemo(() => {
    const hoy = toDateInputValue(new Date());
    const lista = (citas ?? []).filter(
      (c) => filtro === 'todas' || (fechaDeCita(c) >= hoy && c.estado !== 'Cancelada' && c.estado !== 'Atendida')
    );
    return ordenarCitas(lista);
  }, [citas, filtro]);

  const cancelar = async (cita: Cita) => {
    if (!(await showConfirm('¿Seguro que quieres cancelar esta cita?', 'Cancelar cita'))) return;
    setCancelando(cita.idCita);
    try {
      await citasClienteApi.patch(`/Citas/${cita.idCita}`, { estado: 'Cancelada' });
      await cargar();
    } catch (e) {
      showError(mensajeErrorCitas(e, 'No se pudo cancelar la cita.'));
    } finally {
      setCancelando(null);
    }
  };

  if (citas === null) return <LoadingView message="Cargando tus citas..." fullScreen />;

  return (
    <ScrollView
      contentContainerStyle={styles.scroll}
      refreshControl={
        <RefreshControl
          refreshing={refrescando}
          onRefresh={async () => {
            setRefrescando(true);
            await cargar();
            setRefrescando(false);
          }}
          colors={[COLORS.primary]}
        />
      }
    >
      <Text style={styles.saludo}>Hola{session?.nombre ? `, ${session.nombre}` : ''}</Text>
      <Pressable onPress={cambiarEmpresa}>
        <Text style={styles.enlace}>{session?.empresaNombre ?? 'Empresa'} · Cambiar de empresa</Text>
      </Pressable>

      <View style={styles.acciones}>
        <PrimaryButton title="Agendar cita" onPress={() => router.push('/citas/agendar')} fullWidth />
        <PrimaryButton title="Ver servicios y personal" variant="ghost" onPress={() => router.push('/citas/catalogo')} fullWidth />
      </View>

      <Text style={styles.titulo}>Mis citas</Text>
      <FilterChips options={FILTROS} selected={filtro} onSelect={setFiltro} />

      {error ? (
        <EmptyState icon="⚠️" message="No se pudieron cargar tus citas" subtitle={error} actionLabel="Reintentar" onAction={cargar} />
      ) : visibles.length === 0 ? (
        <EmptyState icon="🗓️" message="No tienes citas" subtitle="Agenda tu primera cita con el botón de arriba." />
      ) : (
        visibles.map((c) => (
          <View key={c.idCita}>
            <DetalleCitaView cita={c} mostrarCliente={false} />
            {(c.estado === 'Pendiente' || c.estado === 'Confirmada') && (
              <View style={styles.cancelar}>
                <PrimaryButton
                  title="Cancelar cita"
                  variant="outline"
                  size="small"
                  onPress={() => cancelar(c)}
                  loading={cancelando === c.idCita}
                  disabled={cancelando !== null}
                />
              </View>
            )}
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: SPACING.lg, paddingBottom: SPACING.huge, flexGrow: 1 },
  saludo: { fontSize: FONT_SIZE.title2, fontWeight: FONT_WEIGHT.bold, color: COLORS.text },
  enlace: { fontSize: FONT_SIZE.subhead, color: COLORS.primary, fontWeight: FONT_WEIGHT.semibold, marginTop: SPACING.xs },
  acciones: { gap: SPACING.md, marginVertical: SPACING.xl },
  titulo: { fontSize: FONT_SIZE.title3, fontWeight: FONT_WEIGHT.bold, color: COLORS.text, marginBottom: SPACING.md },
  cancelar: { marginTop: -SPACING.sm, marginBottom: SPACING.lg, alignItems: 'flex-end' },
});
