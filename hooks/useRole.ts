import { useAuth } from '@/context/authContext';
import {
    isAdmin as checkIsAdmin,
    isSuperEmpleado as checkIsSuperEmpleado,
    isTrabajador as checkIsTrabajador,
    puedeRegistrarServicios as checkPuedeRegistrarServicios
} from '@/utils/roles';
import { useMemo } from 'react';

export function useRole() {
  const { usuario } = useAuth();
  
  const isAdmin = useMemo(() => checkIsAdmin(usuario?.rol), [usuario?.rol]);
  const isTrabajador = useMemo(() => checkIsTrabajador(usuario?.rol), [usuario?.rol]);
  const isSuperEmpleado = useMemo(() => checkIsSuperEmpleado(usuario?.rol), [usuario?.rol]);
  const puedeRegistrarServicios = useMemo(() => checkPuedeRegistrarServicios(usuario?.rol), [usuario?.rol]);
  
  return {
    isAdmin,
    isTrabajador,
    isSuperEmpleado,
    puedeRegistrarServicios,
    rol: usuario?.rol,
  };
}
