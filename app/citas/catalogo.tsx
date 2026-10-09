import { citasClienteApi, mensajeErrorCitas } from '@/app/api/citasApi';
import type { ServicioCitas, UsuarioCitas } from '@/app/api/modelos/citas';
import EmptyState from '@/components/EmptyState';
import ListCard from '@/components/ListCard';
import LoadingView from '@/components/LoadingView';
import { COLORS, FONT_SIZE, FONT_WEIGHT, SPACING } from '@/constants/theme';
import { formatDuracion } from '@/utils/citas';
import { formatCurrency } from '@/utils/formatters';
import { FontAwesome5 } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';

/** Servicios agendables y personal activo de la empresa elegida. */
export default function CatalogoCliente() {
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
  if (error) return <EmptyState icon="⚠️" message="No se pudo cargar" subtitle={error} actionLabel="Reintentar" onAction={cargar} />;

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Text style={styles.titulo}>Servicios</Text>
      {servicios.length === 0 ? (
        <Text style={styles.vacio}>No hay servicios disponibles.</Text>
      ) : (
        servicios.map((s) => (
          <ListCard
            key={s.idServicio}
            title={s.nombreServicio}
            subtitle={`${formatDuracion(s.tiempoEstimado)} · ${formatCurrency(s.valor)}`}
            leftIcon={<FontAwesome5 name="concierge-bell" size={16} color={COLORS.primary} />}
          />
        ))
      )}

      <Text style={styles.titulo}>Personal</Text>
      {empleados.length === 0 ? (
        <Text style={styles.vacio}>No hay personal disponible.</Text>
      ) : (
        empleados.map((e) => (
          <ListCard
            key={e.id}
            title={e.nombreUsuario}
            leftIcon={<FontAwesome5 name="user" size={16} color={COLORS.secondary} />}
          />
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: SPACING.lg, paddingBottom: SPACING.huge },
  titulo: { fontSize: FONT_SIZE.title3, fontWeight: FONT_WEIGHT.bold, color: COLORS.text, marginBottom: SPACING.md, marginTop: SPACING.sm },
  vacio: { fontSize: FONT_SIZE.body, color: COLORS.textSecondary, marginBottom: SPACING.lg },
});
