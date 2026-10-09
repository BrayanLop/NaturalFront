import { citasClienteApi, mensajeErrorCitas } from '@/app/api/citasApi';
import type { EmpresaPublica } from '@/app/api/modelos/citas';
import EmptyState from '@/components/EmptyState';
import ListCard from '@/components/ListCard';
import LoadingView from '@/components/LoadingView';
import { COLORS, FONT_SIZE, SPACING } from '@/constants/theme';
import { useCitasAuth } from '@/context/citasAuthContext';
import { showError } from '@/utils/logger';
import { FontAwesome5 } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text } from 'react-native';

/** Elección de empresa (GET /Empresas anónimo -> POST /Auth/select-empresa). */
export default function EmpresasCliente() {
  const { session, seleccionarEmpresa } = useCitasAuth();
  const [empresas, setEmpresas] = useState<EmpresaPublica[] | null>(null);
  const [error, setError] = useState('');
  const [eligiendo, setEligiendo] = useState<string | null>(null);
  const [refrescando, setRefrescando] = useState(false);

  const cargar = useCallback(async () => {
    try {
      const { data } = await citasClienteApi.get<EmpresaPublica[]>('/Empresas');
      setEmpresas(data ?? []);
      setError('');
    } catch (e) {
      setEmpresas([]);
      setError(mensajeErrorCitas(e, 'No se pudieron cargar las empresas.'));
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const elegir = async (empresa: EmpresaPublica) => {
    setEligiendo(empresa.id);
    try {
      await seleccionarEmpresa(empresa.id);
      // El layout redirige a "Mis citas".
    } catch (e) {
      showError(mensajeErrorCitas(e, 'No se pudo entrar a esta empresa.'));
    } finally {
      setEligiendo(null);
    }
  };

  if (empresas === null) return <LoadingView message="Cargando empresas..." fullScreen />;
  if (error) return <EmptyState icon="⚠️" message="No se pudieron cargar las empresas" subtitle={error} actionLabel="Reintentar" onAction={cargar} />;

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
      <Text style={styles.saludo}>Hola{session?.nombre ? `, ${session.nombre}` : ''}. ¿Dónde quieres agendar?</Text>
      {empresas.length === 0 ? (
        <EmptyState icon="🏪" message="No hay empresas disponibles" subtitle="Aún ninguna empresa tiene la agenda activa." />
      ) : (
        empresas.map((e) => (
          <ListCard
            key={e.id}
            title={e.nombre}
            leftIcon={<FontAwesome5 name="store" size={18} color={COLORS.primary} />}
            rightContent={
              eligiendo === e.id ? (
                <ActivityIndicator color={COLORS.primary} />
              ) : (
                <FontAwesome5 name="chevron-right" size={14} color={COLORS.textTertiary} />
              )
            }
            onPress={eligiendo ? undefined : () => elegir(e)}
          />
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: SPACING.lg, paddingBottom: SPACING.huge, flexGrow: 1 },
  saludo: { fontSize: FONT_SIZE.headline, color: COLORS.text, marginBottom: SPACING.lg },
});
