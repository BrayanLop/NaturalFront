import { api } from '../api';
import { Servicio, ServicioCreate, ServicioUpdate } from '../modelos/servicio';

/**
 * Servicio para manejo de Servicios
 * Centraliza todas las llamadas API relacionadas con servicios
 */
export const servicioService = {
  /**
   * Obtiene todos los servicios
   */
  obtenerTodos: () => 
    api.get<Servicio[]>('/Servicio/Obtener'),

  /**
   * Obtiene un servicio por ID
   */
  obtenerPorId: (id: number) => 
    api.get<Servicio>(`/Servicio/Obtener/${id}`),

  /**
   * Crea un nuevo servicio
   */
  crear: (servicio: ServicioCreate) => 
    api.post<Servicio>('/Servicio/Crear', servicio),

  /**
   * Actualiza un servicio existente
   */
  actualizar: (id: number, servicio: ServicioUpdate) => 
    api.put<Servicio>(`/Servicio/Actualizar/${id}`, servicio),

  /**
   * Elimina un servicio
   */
  eliminar: (id: number) => 
    api.delete(`/Servicio/Eliminar/${id}`),
};
