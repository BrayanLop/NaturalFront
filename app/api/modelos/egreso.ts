export interface EgresoEmpresa {
  empresaId: number;
  personaId: number;
  nombrePersona: string;
  valorEgreso: number;
  motivo: string;
  fechaRegistro?: string;
}
