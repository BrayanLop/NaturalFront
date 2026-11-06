import ListaAccesos from '@/components/accesos/ListaAccesos';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { clienteAccesosPlataforma } from '../../../../../api/accesosClient';

/** Accesos de una empresa elegida por el superadmin, contra Brar. */
export default function AccesosDeEmpresa() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const cliente = useMemo(() => clienteAccesosPlataforma(Number(id)), [id]);

  return (
    <ListaAccesos
      cliente={cliente}
      onCrear={(personaId) =>
        router.push({
          pathname: '/plataforma/empresas/[id]/accesos/crear',
          params: { id: String(id), ...(personaId ? { personaId: String(personaId) } : {}) },
        })
      }
      onAbrirDetalle={(a) =>
        router.push({
          pathname: '/plataforma/empresas/[id]/accesos/[usuarioId]',
          params: {
            id: String(id),
            usuarioId: String(a.usuarioId),
            nombre: `${a.nombre} ${a.apellido}`,
            usuario: a.nombreUsuario ?? '',
            rol: a.rol ?? '',
          },
        })
      }
    />
  );
}
