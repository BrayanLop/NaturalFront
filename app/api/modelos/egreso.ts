export interface EgresoEmpresa {
  egresoId: number;
  empresaId: number;
  personaId: number;
  nombrePersona: string;
  valorEgreso: number;
  motivo: string;
  fechaRegistro?: string;
  seDescuenta: boolean;
  /** E = efectivo, T = transferencia; null en registros antiguos. */
  formaPago?: 'E' | 'T' | null;
}
