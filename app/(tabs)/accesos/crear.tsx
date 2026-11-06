import FormCrearAcceso from '@/components/accesos/FormCrearAcceso';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { clienteAccesosEmpresa } from '../../api/accesosClient';

export default function CrearAcceso() {
  const router = useRouter();
  const params = useLocalSearchParams<{ personaId?: string }>();

  return (
    <FormCrearAcceso
      cliente={clienteAccesosEmpresa}
      personaIdInicial={params.personaId}
      onCreado={() => router.back()}
    />
  );
}
