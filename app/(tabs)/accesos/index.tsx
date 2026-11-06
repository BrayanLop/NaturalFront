import EmptyState from '@/components/EmptyState';
import ListaAccesos from '@/components/accesos/ListaAccesos';
import { COLORS, SPACING } from '@/constants/theme';
import { useRole } from '@/hooks/useRole';
import { puedeGestionarAccesos } from '@/utils/roles';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { clienteAccesosEmpresa } from '../../api/accesosClient';

/** Accesos de la empresa del administrador (rol 01), contra Natural. */
export default function Accesos() {
  const router = useRouter();
  const { rol } = useRole();

  if (!puedeGestionarAccesos(rol)) {
    return (
      <View style={styles.container}>
        <EmptyState message="Sin permiso" icon="🔒" subtitle="Solo el administrador gestiona los accesos" />
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

const styles = StyleSheet.create({
  container: { flex: 1, padding: SPACING.lg, backgroundColor: COLORS.background },
});
