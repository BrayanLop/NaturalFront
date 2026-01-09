export interface ConfiguracionServicio {
  id?: number;
  servicioId: number;
  nombreServicio?: string;
  porcentajeTrabajador: number;
  porcentajeEmpresa: number;
  estado: boolean;
  empresaId?: number;
}

export interface ConfiguracionServicioCreate {
  servicioId: number;
  porcentajeTrabajador: number;
  porcentajeEmpresa: number;
  estado: boolean;
}

export interface ConfiguracionServicioUpdate extends ConfiguracionServicioCreate {
  id: number;
}
