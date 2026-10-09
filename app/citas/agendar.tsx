import { citasClienteApi, crearCita, mensajeErrorCitas, mostrarErrorEnvioCita } from '@/app/api/citasApi';
import type { CrearCitaRequest, ServicioCitas, UsuarioCitas } from '@/app/api/modelos/citas';
import FormularioCita, { type ResultadoEnvioCita } from '@/components/citas/FormularioCita';
import EmptyState from '@/components/EmptyState';
import LoadingView from '@/components/LoadingView';
import { showSuccess } from '@/utils/logger';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';

/** El cliente agenda para sí mismo: servicios + quién atiende + turno libre. */
export default function AgendarCliente() {
  const router = useRouter();
  const [servicios, setServicios] = useState<ServicioCitas[] | null>(null);
  const [empleados, setEmpleados] = useState<UsuarioCitas[]>([]);
  const [error, setError] = useState('');

  const cargar = useCallback(async () => {
    try {
      // Para el cliente el backend ya filtra: servicios agendables y empleados activos.
      const [s, u] = await Promise.all([
        citasClienteApi.get<ServicioCitas[]>('/Servicios'),
        citasClienteApi.get<UsuarioCitas[]>('/Usuarios'),
      ]);
      setServicios(s.data ?? []);
      setEmpleados(u.data ?? []);
      setError('');
    } catch (e) {
      setServicios([]);
      setError(mensajeErrorCitas(e, 'No se pudo cargar la información para agendar.'));
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const agendar = async (datos: CrearCitaRequest): Promise<ResultadoEnvioCita> => {
    try {
      // idCliente = 0: el backend usa el usuario del token.
      await crearCita(citasClienteApi, { ...datos, idCliente: 0 });
      showSuccess('¡Tu cita quedó agendada!');
      router.back();
      return 'ok';
    } catch (e) {
      return mostrarErrorEnvioCita(e, 'No se pudo agendar la cita.');
    }
  };

  if (servicios === null) return <LoadingView message="Cargando..." fullScreen />;
  if (error) return <EmptyState icon="⚠️" message="No se pudo cargar" subtitle={error} actionLabel="Reintentar" onAction={cargar} />;

  return <FormularioCita api={citasClienteApi} servicios={servicios} empleados={empleados} onSubmit={agendar} />;
}
