import DetalleAcceso from '@/components/accesos/DetalleAcceso';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { clienteAccesosEmpresa } from '../../api/accesosClient';

export default function DetalleAccesoEmpresa() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string; nombre?: string; usuario?: string; rol?: string }>();

  return (
    <DetalleAcceso
      cliente={clienteAccesosEmpresa}
      usuarioId={Number(params.id)}
      nombre={params.nombre}
      usuario={params.usuario}
      rolInicial={params.rol}
      onEliminado={() => router.back()}
    />
  );
}
