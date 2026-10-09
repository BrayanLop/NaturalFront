import { citasPersonalApi, mensajeErrorCitas } from '@/app/api/citasApi';
import type { Cita, CrearCitaRequest, ServicioCitas } from '@/app/api/modelos/citas';
import FormularioCita from '@/components/citas/FormularioCita';
import EmptyState from '@/components/EmptyState';
import LoadingView from '@/components/LoadingView';
import { COLORS } from '@/constants/theme';
import { useAgendaPersonal } from '@/hooks/useAgendaPersonal';
import { useRole } from '@/hooks/useRole';
import { showError, showSuccess } from '@/utils/logger';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { View } from 'react-native';

/** Crear cita (solo 01/03): cliente, quién atiende, servicios y fecha/hora. */
export default function CrearCitaPersonal() {
  const router = useRouter();
  const { isAdmin } = useRole();
  const agenda = useAgendaPersonal();
  const [servicios, setServicios] = useState<ServicioCitas[] | null>(null);
  const [enviando, setEnviando] = useState(false);

  useFocusEffect(
    useCallback(() => {
      citasPersonalApi
        .get<ServicioCitas[]>('/Servicios')
        .then(({ data }) => setServicios((data ?? []).filter((s) => s.agendable)))
        .catch((e) => {
          setServicios([]);
          showError(mensajeErrorCitas(e, 'No se pudieron cargar los servicios.'));
        });
    }, [])
  );

  if (!isAdmin) return <EmptyState icon="🔒" message="Solo un administrador puede crear citas." />;
  if (agenda.estado === 'cargando' || servicios === null) return <LoadingView message="Cargando..." fullScreen />;
  if (agenda.estado !== 'ok') {
    return <EmptyState icon="⚠️" message="No se pudo cargar la información" subtitle={agenda.error} actionLabel="Reintentar" onAction={agenda.cargar} />;
  }

  const crear = async (datos: CrearCitaRequest) => {
    setEnviando(true);
    try {
      const { data } = await citasPersonalApi.post<Cita>('/Citas', datos);
      showSuccess('Cita creada.');
      router.replace(`/agenda/${data.idCita}`);
    } catch (e) {
      showError(mensajeErrorCitas(e, 'No se pudo crear la cita.'));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <FormularioCita
        servicios={servicios}
        empleados={agenda.empleados.filter((e) => e.activo)}
        clientes={agenda.clientes}
        enviando={enviando}
        textoBoton="Crear cita"
        onSubmit={crear}
      />
    </View>
  );
}
