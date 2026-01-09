export interface ConfiguracionGeneral {
  periodicidad: string;
  valorPeriodicidad: number;
  empresaId?: number | null;
}

export type Periodicidad = 'M' | 'Q' | 'S' | 'D';

export const PERIODICIDAD_DIAS: Record<Periodicidad, number> = {
  M: 30,  // Mensual
  Q: 15,  // Quincenal
  S: 7,   // Semanal
  D: 0,   // Personalizado (se usa valorPeriodicidad)
};

export const PERIODICIDAD_LABELS: Record<Periodicidad, string> = {
  M: 'Mensual (30 días)',
  Q: 'Quincenal (15 días)',
  S: 'Semanal (7 días)',
  D: 'Dias (personalizado)',
};
