// Formateo de moneda a pesos colombianos
export function formatCurrency(value: number): string {
  return value.toLocaleString('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  });
}

// Formateo de fecha a formato local
export function formatDate(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('es-CO');
}

// Formateo de fecha y hora
export function formatDateTime(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleString('es-CO');
}

// Formateo de número de teléfono (10 dígitos)
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
  }
  return phone;
}

// Convertir fecha a formato YYYY-MM-DD para inputs
export function toDateInputValue(date: Date): string {
  return date.toISOString().slice(0, 10);
}

// Formatear cédula con separadores de miles
export function formatCedula(cedula: string): string {
  const cleaned = cedula.replace(/\D/g, '');
  return cleaned.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

// Formatear porcentaje
export function formatPercentage(value: number): string {
  return `${value.toFixed(2)}%`;
}

// Capitalizar primera letra de cada palabra
export function capitalizeWords(text: string): string {
  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Formatear nombre completo
export function formatFullName(nombre: string, apellido?: string): string {
  if (apellido) {
    return `${capitalizeWords(nombre)} ${capitalizeWords(apellido)}`;
  }
  return capitalizeWords(nombre);
}

// Formatear pesos sin símbolo
export function formatPesos(value: number): string {
  return value.toLocaleString('es-CO');
}
