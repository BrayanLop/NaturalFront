import DetalleAcceso from '@/components/accesos/DetalleAcceso';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { clienteAccesosPlataforma } from '../../../../../api/accesosClient';

export default function DetalleAccesoDeEmpresa() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string; usuarioId: string; nombre?: string; usuario?: string; rol?: string }>();
  const cliente = useMemo(() => clienteAccesosPlataforma(Number(params.id)), [params.id]);

  return (
    <DetalleAcceso
      cliente={cliente}
      usuarioId={Number(params.usuarioId)}
      nombre={params.nombre}
      usuario={params.usuario}
      rolInicial={params.rol}
      onEliminado={() => router.back()}
    />
  );
}
