import { citasClienteApi, mensajeErrorCitas } from '@/app/api/citasApi';
import type { CrearCitaRequest, ServicioCitas, UsuarioCitas } from '@/app/api/modelos/citas';
import FormularioCita from '@/components/citas/FormularioCita';
import EmptyState from '@/components/EmptyState';
import LoadingView from '@/components/LoadingView';
import { showError, showSuccess } from '@/utils/logger';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';

/** El cliente agenda para sí mismo: servicios + quién atiende + fecha/hora. */
export default function AgendarCliente() {
  const router = useRouter();
  const [servicios, setServicios] = useState<ServicioCitas[] | null>(null);
  const [empleados, setEmpleados] = useState<UsuarioCitas[]>([]);
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

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

  const agendar = async (datos: CrearCitaRequest) => {
    setEnviando(true);
    try {
      // idCliente = 0: el backend usa el usuario del token.
      await citasClienteApi.post('/Citas', { ...datos, idCliente: 0 });
      showSuccess('¡Tu cita quedó agendada!');
      router.back();
    } catch (e) {
      showError(mensajeErrorCitas(e, 'No se pudo agendar la cita.'));
    } finally {
      setEnviando(false);
    }
  };

  if (servicios === null) return <LoadingView message="Cargando..." fullScreen />;
  if (error) return <EmptyState icon="⚠️" message="No se pudo cargar" subtitle={error} actionLabel="Reintentar" onAction={cargar} />;

  return <FormularioCita servicios={servicios} empleados={empleados} enviando={enviando} onSubmit={agendar} />;
}
