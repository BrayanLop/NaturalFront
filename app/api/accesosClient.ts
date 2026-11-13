import { api } from './api';
import { plataformaApi } from './plataformaApi';
import { Acceso, CrearAccesoRequest } from './modelos/acceso';

/**
 * Operaciones sobre accesos (usuarios). Las mismas pantallas sirven al administrador de la empresa (rol 01,
 * contra Natural) y al superadmin de plataforma (rol 00, contra Brar, eligiendo la empresa).
 */
export interface ClienteAccesos {
  listar(): Promise<Acceso[]>;
  crear(solicitud: CrearAccesoRequest): Promise<void>;
  cambiarEstado(usuarioId: number, activo: boolean): Promise<void>;
  cambiarRol(usuarioId: number, rol: string): Promise<void>;
  /** `nuevaContrasena` ya viene hasheada (SHA-256 base64). */
  restablecerContrasena(usuarioId: number, nuevaContrasena: string): Promise<void>;
  eliminar(usuarioId: number): Promise<void>;
}

export const clienteAccesosEmpresa: ClienteAccesos = {
  listar: async () => (await api.get('Acceso/Obtener')).data,
  crear: async (s) => {
    await api.post('Acceso/Crear', s);
  },
  cambiarEstado: async (id, activo) => {
    await api.patch(`Acceso/CambiarEstado/${id}`, null, { params: { activo } });
  },
  cambiarRol: async (id, rol) => {
    await api.patch(`Acceso/CambiarRol/${id}`, { rol });
  },
  restablecerContrasena: async (id, nuevaContrasena) => {
    await api.put(`Acceso/RestablecerContrasena/${id}`, { nuevaContrasena });
  },
  eliminar: async (id) => {
    await api.delete(`Acceso/Eliminar/${id}`);
  },
};

export function clienteAccesosPlataforma(empresaId: number): ClienteAccesos {
  const base = `/Empresas/${empresaId}/Accesos`;
  return {
    listar: async () => (await plataformaApi.get(base)).data,
    crear: async (s) => {
      await plataformaApi.post(base, s);
    },
    cambiarEstado: async (id, activo) => {
      await plataformaApi.patch(`${base}/${id}/Estado`, null, { params: { activo } });
    },
    cambiarRol: async (id, rol) => {
      await plataformaApi.patch(`${base}/${id}/Rol`, { rol });
    },
    restablecerContrasena: async (id, nuevaContrasena) => {
      await plataformaApi.put(`${base}/${id}/Contrasena`, { nuevaContrasena });
    },
    eliminar: async (id) => {
      await plataformaApi.delete(`${base}/${id}`);
    },
  };
}
