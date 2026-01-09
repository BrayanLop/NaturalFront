export interface Persona {
  id: number;
  nombre: string;
  apellido: string;
  cedula: string;
  residencia: string;
  email: string;
  edad: number;
  celular?: string;
  fechaNacimiento: string;
  rol?: string;
  empresaId?: number;
}

export interface PersonaCreate {
  nombre: string;
  apellido: string;
  cedula: string;
  residencia: string;
  email: string;
  edad: number;
  celular: string;
  fechaNacimiento: string;
  rol: string;
}

export interface PersonaUpdate extends PersonaCreate {
  id: number;
}
