import { citasClienteApi, mensajeErrorCitas } from '@/app/api/citasApi';
import type { ServicioCitas, UsuarioCitas } from '@/app/api/modelos/citas';
import EmptyState from '@/components/EmptyState';
import { ListRow } from '@/components/ds';
import LoadingView from '@/components/LoadingView';
import { FONT_SIZE, FONT_WEIGHT, SPACING, useEstilos, type Tema } from '@/theme';
import { formatDuracion } from '@/utils/citas';
import { formatCurrency } from '@/utils/formatters';
import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';

/** Servicios agendables y personal activo de la empresa elegida. */
export default function CatalogoCliente() {
  const estilos = useEstilos(crearEstilos);
  const [servicios, setServicios] = useState<ServicioCitas[] | null>(null);
  const [empleados, setEmpleados] = useState<UsuarioCitas[]>([]);
  const [error, setError] = useState('');

  const cargar = useCallback(async () => {
    try {
      const [s, u] = await Promise.all([
        citasClienteApi.get<ServicioCitas[]>('/Servicios'),
        citasClienteApi.get<UsuarioCitas[]>('/Usuarios'),
      ]);
      setServicios(s.data ?? []);
      setEmpleados(u.data ?? []);
      setError('');
    } catch (e) {
      setServicios([]);
      setError(mensajeErrorCitas(e, 'No se pudo cargar la información.'));
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  if (servicios === null) return <LoadingView message="Cargando..." fullScreen />;
  if (error) return <EmptyState message="No se pudo cargar" subtitle={error} actionLabel="Reintentar" onAction={cargar} />;

  return (
    <ScrollView contentContainerStyle={estilos.scroll}>
      <Text style={estilos.titulo}>Servicios</Text>
      {servicios.length === 0 ? (
        <Text style={estilos.vacio}>No hay servicios disponibles.</Text>
      ) : (
        servicios.map((s) => (
          <ListRow
            key={s.idServicio}
            title={s.nombreServicio}
            subtitle={`${formatDuracion(s.tiempoEstimado)} · ${formatCurrency(s.valor)}`}
            icon="briefcase-outline"
          />
        ))
      )}

      <Text style={estilos.titulo}>Personal</Text>
      {empleados.length === 0 ? (
        <Text style={estilos.vacio}>No hay personal disponible.</Text>
      ) : (
        empleados.map((e) => (
          <ListRow key={e.id} title={e.nombreUsuario} icon="person-outline" />
        ))
      )}
    </ScrollView>
  );
}

const crearEstilos = (t: Tema) => StyleSheet.create({
  scroll: { padding: SPACING.lg, paddingBottom: SPACING.huge },
  titulo: { fontSize: FONT_SIZE.title3, fontWeight: FONT_WEIGHT.bold, color: t.colores.texto, marginBottom: SPACING.md, marginTop: SPACING.sm },
  vacio: { fontSize: FONT_SIZE.body, color: t.colores.textoSuave, marginBottom: SPACING.lg },
});
