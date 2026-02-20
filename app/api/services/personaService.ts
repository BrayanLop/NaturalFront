import { api } from '../api';
import { Persona, PersonaCreate, PersonaUpdate } from '../modelos/persona';

/**
 * Servicio para manejo de Personas
 * Centraliza todas las llamadas API relacionadas con personas
 */
export const personaService = {
  /**
   * Obtiene todas las personas
   */
  obtenerTodas: () => 
    api.get<Persona[]>('/Persona/Obtener'),

  /**
   * Obtiene una persona por ID
   */
  obtenerPorId: (id: number) => 
    api.get<Persona>(`/Persona/Obtener/${id}`),

  /**
   * Crea una nueva persona
   */
  crear: (persona: PersonaCreate) => 
    api.post<Persona>('/Persona/Crear', persona),

  /**
   * Actualiza una persona existente
   */
  actualizar: (id: number, persona: PersonaUpdate) => 
    api.put<Persona>(`/Persona/Actualizar/${id}`, persona),

  /**
   * Elimina una persona
   */
  eliminar: (id: number) => 
    api.delete(`/Persona/Eliminar/${id}`),
};
