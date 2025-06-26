export interface Persona {
  id: number;
  nombre: string;
  apellido: string;
  cedula: string;
  residencia: string;
  email: string;
  edad: number;
  celular?: string; // Opcional, igual que en .NET
  fechaNacimiento: string; // Se recibe como string en JSON (ISO date)
}
