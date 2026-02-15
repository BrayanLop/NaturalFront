export interface EgresoEmpresa {
  egresoId: number;
  empresaId: number;
  personaId: number;
  nombrePersona: string;
  valorEgreso: number;
  motivo: string;
  fechaRegistro?: string;
  seDescuenta: boolean;
}
