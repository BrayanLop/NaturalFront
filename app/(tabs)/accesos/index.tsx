import ListaAccesos from '@/components/accesos/ListaAccesos';
import { EmptyState } from '@/components/ds';
import { useRole } from '@/hooks/useRole';
import { SPACING, useEstilos, type Tema } from '@/theme';
import { puedeGestionarAccesos } from '@/utils/roles';
import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { clienteAccesosEmpresa } from '../../api/accesosClient';

const crearEstilos = (t: Tema) => ({
  container: { flex: 1, padding: SPACING.lg, backgroundColor: t.colores.fondo, justifyContent: 'center' as const },
});

/** Accesos de la empresa del administrador (rol 01), contra Natural. */
export default function Accesos() {
  const router = useRouter();
  const { rol } = useRole();
  const estilos = useEstilos(crearEstilos);

  if (!puedeGestionarAccesos(rol)) {
    return (
      <View style={estilos.container}>
        <EmptyState icon="lock-closed-outline" title="Sin permiso" subtitle="Solo el administrador gestiona los accesos" />
      </View>
    );
  }

  return (
    <ListaAccesos
      cliente={clienteAccesosEmpresa}
      onCrear={(personaId) =>
        router.push({ pathname: '/accesos/crear', params: personaId ? { personaId: String(personaId) } : {} })
      }
      onAbrirDetalle={(a) =>
        router.push({
          pathname: '/accesos/[id]',
          params: {
            id: String(a.usuarioId),
            nombre: `${a.nombre} ${a.apellido}`,
            usuario: a.nombreUsuario ?? '',
            rol: a.rol ?? '',
          },
        })
      }
    />
  );
}
