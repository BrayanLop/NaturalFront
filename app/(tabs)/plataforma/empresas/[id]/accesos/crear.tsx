import FormCrearAcceso from '@/components/accesos/FormCrearAcceso';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { clienteAccesosPlataforma } from '../../../../../api/accesosClient';

export default function CrearAccesoDeEmpresa() {
  const router = useRouter();
  const { id, personaId } = useLocalSearchParams<{ id: string; personaId?: string }>();
  const cliente = useMemo(() => clienteAccesosPlataforma(Number(id)), [id]);

  return <FormCrearAcceso cliente={cliente} personaIdInicial={personaId} onCreado={() => router.back()} />;
}
