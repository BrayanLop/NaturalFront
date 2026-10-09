import { citasPersonalApi, crearCita, mensajeErrorCitas, mostrarErrorEnvioCita } from '@/app/api/citasApi';
import type { CrearCitaRequest, ServicioCitas } from '@/app/api/modelos/citas';
import FormularioCita, { type ResultadoEnvioCita } from '@/components/citas/FormularioCita';
import EmptyState from '@/components/EmptyState';
import LoadingView from '@/components/LoadingView';
import { COLORS } from '@/constants/theme';
import { useAgendaPersonal } from '@/hooks/useAgendaPersonal';
import { useRole } from '@/hooks/useRole';
import { showError, showSuccess } from '@/utils/logger';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { View } from 'react-native';

/** Crear cita (solo 01/03): cliente, quién atiende, servicios y turno libre. */
export default function CrearCitaPersonal() {
  const router = useRouter();
  const { isAdmin } = useRole();
  const agenda = useAgendaPersonal();
  const [servicios, setServicios] = useState<ServicioCitas[] | null>(null);

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

  const crear = async (datos: CrearCitaRequest): Promise<ResultadoEnvioCita> => {
    try {
      const cita = await crearCita(citasPersonalApi, datos);
      showSuccess('Cita creada.');
      router.replace(`/agenda/${cita.idCita}`);
      return 'ok';
    } catch (e) {
      return mostrarErrorEnvioCita(e, 'No se pudo crear la cita.');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <FormularioCita
        api={citasPersonalApi}
        servicios={servicios}
        empleados={agenda.empleados.filter((e) => e.activo)}
        clientes={agenda.clientes}
        textoBoton="Crear cita"
        onSubmit={crear}
      />
    </View>
  );
}
