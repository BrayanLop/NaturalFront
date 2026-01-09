export interface Servicio {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  disponible: boolean;
  fechaCreacion: string;
}

export interface ServicioCreate {
  nombre: string;
  descripcion: string;
  precio: number;
  disponible: boolean;
}

export interface ServicioUpdate extends ServicioCreate {
  id: number;
  fechaCreacion: string;
}
