import { citasPersonalApi, esAgendaNoActivada, mensajeErrorCitas } from '@/app/api/citasApi';
import { citasConfigurado } from '@/app/api/citasConfig';
import type { Cita, UsuarioCitas } from '@/app/api/modelos/citas';
import { useAuth } from '@/context/authContext';
import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';

export type EstadoCarga = 'cargando' | 'ok' | 'noActivada' | 'error';

/**
 * Carga la agenda del personal (citas + usuarios del tenant) con el token de Natural y
 * resuelve el Usuario de Citas del usuario en sesión (vinculado por su id de Natural).
 */
export function useAgendaPersonal() {
  const { usuario, isDemo } = useAuth();
  const [estado, setEstado] = useState<EstadoCarga>('cargando');
  const [error, setError] = useState('');
  const [citas, setCitas] = useState<Cita[]>([]);
  const [usuarios, setUsuarios] = useState<UsuarioCitas[]>([]);
  const [refrescando, setRefrescando] = useState(false);
  const montado = useRef(true);

  const cargar = useCallback(async () => {
    if (!citasConfigurado || isDemo) return;
    try {
      const [resCitas, resUsuarios] = await Promise.all([
        citasPersonalApi.get<Cita[]>('/Citas'),
        citasPersonalApi.get<UsuarioCitas[]>('/Usuarios'),
      ]);
      if (!montado.current) return;
      setCitas(resCitas.data ?? []);
      setUsuarios(resUsuarios.data ?? []);
      setEstado('ok');
    } catch (e) {
      if (!montado.current) return;
      if (esAgendaNoActivada(e)) {
        setEstado('noActivada');
      } else {
        setError(mensajeErrorCitas(e, 'No se pudo cargar la agenda.'));
        setEstado('error');
      }
    }
  }, [isDemo]);

  useFocusEffect(
    useCallback(() => {
      montado.current = true;
      cargar();
      return () => {
        montado.current = false;
      };
    }, [cargar])
  );

  const refrescar = useCallback(async () => {
    setRefrescando(true);
    await cargar();
    setRefrescando(false);
  }, [cargar]);

  const miUsuario = usuarios.find((u) => u.personaNaturalId != null && u.personaNaturalId === usuario?.id);
  const empleados = usuarios.filter((u) => u.personaNaturalId != null);
  const clientes = usuarios.filter((u) => u.personaNaturalId == null && u.activo);

  return {
    estado,
    error,
    citas,
    usuarios,
    empleados,
    clientes,
    miUsuarioId: miUsuario?.id ?? null,
    cargar,
    refrescar,
    refrescando,
    setCitas,
  };
}
