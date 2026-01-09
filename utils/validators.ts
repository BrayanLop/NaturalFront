// Definición de validaciones centralizadas
export interface ValidationRule {
  regex: RegExp;
  mensaje: string;
}

export interface ValidationRules {
  [key: string]: ValidationRule;
}

// Validaciones para personas
export const personaValidations: ValidationRules = {
  nombre: {
    regex: /^[A-Za-zÁÉÍÓÚáéíóúñÑ\s]{3,}$/,
    mensaje: 'Nombre inválido (mínimo 3 caracteres, solo letras)',
  },
  apellido: {
    regex: /^[A-Za-zÁÉÍÓÚáéíóúñÑ\s]{3,}$/,
    mensaje: 'Apellido inválido (mínimo 3 caracteres, solo letras)',
  },
  cedula: {
    regex: /^\d{6,10}$/,
    mensaje: 'Cédula inválida (6-10 dígitos)',
  },
  residencia: {
    regex: /^.{5,}$/,
    mensaje: 'Residencia inválida (mínimo 5 caracteres)',
  },
  email: {
    regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    mensaje: 'Email inválido',
  },
  edad: {
    regex: /^(?:[1-9][0-9]?|1[01][0-9]|120)$/,
    mensaje: 'Edad inválida (1-120)',
  },
  celular: {
    regex: /^\d{10}$/,
    mensaje: 'Celular inválido (10 dígitos)',
  },
};

// Validaciones para servicios
export const servicioValidations: ValidationRules = {
  nombre: {
    regex: /^.{3,50}$/,
    mensaje: 'Nombre requerido (3-50 caracteres)',
  },
  precio: {
    regex: /^\d+$/,
    mensaje: 'Precio inválido (solo números)',
  },
};

// Validaciones para configuración de servicios
export const configuracionValidations: ValidationRules = {
  porcentajeTrabajador: {
    regex: /^\d+(\.\d{1,2})?$/,
    mensaje: 'Porcentaje inválido',
  },
  porcentajeEmpresa: {
    regex: /^\d+(\.\d{1,2})?$/,
    mensaje: 'Porcentaje inválido',
  },
};

// Función genérica para validar un campo
export function validateField(
  value: string,
  rule: ValidationRule
): string | null {
  if (!rule.regex.test(value)) {
    return rule.mensaje;
  }
  return null;
}

// Función para validar múltiples campos
export function validateFields(
  values: Record<string, string>,
  rules: ValidationRules
): Record<string, string> {
  const errors: Record<string, string> = {};
  
  Object.keys(rules).forEach((field) => {
    const value = values[field];
    const error = validateField(value, rules[field]);
    if (error) {
      errors[field] = error;
    }
  });
  
  return errors;
}

// Validación de porcentajes que sumen 100
export function validatePercentageSum(
  value1: number,
  value2: number
): boolean {
  return Math.abs(value1 + value2 - 100) < 0.01;
}

// Validación de campo no vacío
export function isNotEmpty(value: string): boolean {
  return value.trim().length > 0;
}

// Validación de número positivo
export function isPositiveNumber(value: string | number): boolean {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return !isNaN(num) && num > 0;
}
