import { citasClienteApi, mensajeErrorCitas } from '@/app/api/citasApi';
import type { EmpresaPublica } from '@/app/api/modelos/citas';
import EmptyState from '@/components/EmptyState';
import { ListRow } from '@/components/ds';
import LoadingView from '@/components/LoadingView';
import { FONT_SIZE, SPACING, useEstilos, type Tema, useTheme } from '@/theme';
import { useCitasAuth } from '@/context/citasAuthContext';
import { showError } from '@/utils/logger';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text } from 'react-native';

/** Elección de empresa (GET /Empresas anónimo -> POST /Auth/select-empresa). */
export default function EmpresasCliente() {
  const estilos = useEstilos(crearEstilos);
  const { tema } = useTheme();
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
  if (error) return <EmptyState message="No se pudieron cargar las empresas" subtitle={error} actionLabel="Reintentar" onAction={cargar} />;

  return (
    <ScrollView
      contentContainerStyle={estilos.scroll}
      refreshControl={
        <RefreshControl
          refreshing={refrescando}
          onRefresh={async () => {
            setRefrescando(true);
            await cargar();
            setRefrescando(false);
          }}
          colors={[tema.colores.primario]}
        />
      }
    >
      <Text style={estilos.saludo}>Hola{session?.nombre ? `, ${session.nombre}` : ''}. ¿Dónde quieres agendar?</Text>
      {empresas.length === 0 ? (
        <EmptyState message="No hay empresas disponibles" subtitle="Aún ninguna empresa tiene la agenda activa." />
      ) : (
        empresas.map((e) => (
          <ListRow
            key={e.id}
            title={e.nombre}
            icon="storefront-outline"
            chevron={eligiendo !== e.id}
            trailing={eligiendo === e.id ? <ActivityIndicator color={tema.colores.primario} /> : undefined}
            onPress={eligiendo ? undefined : () => elegir(e)}
          />
        ))
      )}
    </ScrollView>
  );
}

const crearEstilos = (t: Tema) => StyleSheet.create({
  scroll: { padding: SPACING.lg, paddingBottom: SPACING.huge, flexGrow: 1 },
  saludo: { fontSize: FONT_SIZE.headline, color: t.colores.texto, marginBottom: SPACING.lg },
});
