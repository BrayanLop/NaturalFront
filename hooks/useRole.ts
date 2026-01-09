import { useAuth } from '@/context/authContext';
import { isAdmin as checkIsAdmin, isTrabajador as checkIsTrabajador } from '@/utils/roles';
import { useMemo } from 'react';

export function useRole() {
  const { usuario } = useAuth();
  
  const isAdmin = useMemo(() => checkIsAdmin(usuario?.rol), [usuario?.rol]);
  const isTrabajador = useMemo(() => checkIsTrabajador(usuario?.rol), [usuario?.rol]);
  
  return {
    isAdmin,
    isTrabajador,
    rol: usuario?.rol,
  };
}
