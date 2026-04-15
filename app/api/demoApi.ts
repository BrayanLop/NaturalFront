/**
 * Demo API - Intercepta las llamadas a la API cuando está en modo demo
 * Retorna datos del store local en lugar de hacer requests reales
 * 
 * CUBRE TODOS LOS MÓDULOS:
 * - Login
 * - Personas (CRUD completo)
 * - Servicios (CRUD completo)
 * - Configuración de Servicios (CRUD completo)
 * - Registro de Servicios (crear, listar, confirmar)
 * - Egresos (crear, listar)
 * - Contabilidad (pagos, liquidaciones, consolidados)
 * - Configuración General
 * - Evidencias (simulado)
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { AxiosRequestConfig, AxiosResponse } from 'axios';
import { DEMO_USER, demoStore } from './demoData';

// Flag para saber si estamos en modo demo (cache en memoria)
let isDemoModeCache: boolean | null = null;

export const setDemoMode = async (value: boolean) => {
  isDemoModeCache = value;
  await AsyncStorage.setItem('isDemo', value ? 'true' : 'false');
  if (value) {
    demoStore.reset(); // Reiniciar datos al entrar en modo demo
  }
};

// Obtener modo demo - verifica AsyncStorage si no hay cache
export const getDemoMode = async (): Promise<boolean> => {
  if (isDemoModeCache !== null) {
    return isDemoModeCache;
  }
  try {
    const value = await AsyncStorage.getItem('isDemo');
    isDemoModeCache = value === 'true';
    return isDemoModeCache;
  } catch {
    return false;
  }
};

// Versión síncrona para casos donde ya se verificó
export const getDemoModeSync = () => isDemoModeCache === true;

// Simular delay de red
const simulateDelay = (ms: number = 200) => new Promise(resolve => setTimeout(resolve, ms));

// Crear respuesta mock tipo Axios
function createMockResponse<T>(data: T, status: number = 200): AxiosResponse<T> {
  return {
    data,
    status,
    statusText: 'OK',
    headers: {},
    config: {} as any,
  };
}

// Extraer parámetros de query string
function getQueryParams(url: string): Record<string, string> {
  const params: Record<string, string> = {};
  const queryIndex = url.indexOf('?');
  if (queryIndex === -1) return params;
  
  const queryString = url.substring(queryIndex + 1);
  queryString.split('&').forEach(pair => {
    const [key, value] = pair.split('=');
    if (key) params[decodeURIComponent(key)] = decodeURIComponent(value || '');
  });
  return params;
}

// Función para manejar requests en modo demo
export async function handleDemoRequest(config: AxiosRequestConfig): Promise<AxiosResponse<any> | null> {
  // Verificar modo demo desde AsyncStorage
  const isDemo = await getDemoMode();
  if (!isDemo) return null;

  await simulateDelay();

  // Normalizar URL - asegurar que empiece con /
  let url = config.url || '';
  if (!url.startsWith('/') && !url.startsWith('http')) {
    url = '/' + url;
  }
  
  const method = config.method?.toUpperCase() || 'GET';
  let data: any = {};
  
  try {
    data = config.data ? (typeof config.data === 'string' ? JSON.parse(config.data) : config.data) : {};
  } catch {
    data = config.data || {};
  }

  // Merge params from config.params
  const queryParams = { ...getQueryParams(url), ...(config.params || {}) };

  console.log(`[DEMO API] ${method} ${url}`, { data, queryParams });

  // ═══════════════════════════════════════════════════════════════════
  // LOGIN
  // ═══════════════════════════════════════════════════════════════════
  if (url.includes('/Login/Autenticar')) {
    return createMockResponse({
      token: DEMO_USER.token,
      expiraEn: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      persona: DEMO_USER,
    });
  }

  // ═══════════════════════════════════════════════════════════════════
  // USUARIO
  // ═══════════════════════════════════════════════════════════════════
  if (url.match(/\/Usuario\/ActualizarContrasena/i) && method === 'PUT') {
    return createMockResponse({ message: 'Contraseña actualizada (demo)' });
  }

  // ═══════════════════════════════════════════════════════════════════
  // PERSONAS
  // ═══════════════════════════════════════════════════════════════════
  if (url.match(/\/Persona\/Obtener$/i) && method === 'GET') {
    return createMockResponse(demoStore.getPersonas());
  }
  
  if (url.match(/\/Persona\/Obtener\/(\d+)/i) && method === 'GET') {
    const id = parseInt(url.match(/\/Persona\/Obtener\/(\d+)/i)![1]);
    const persona = demoStore.getPersonaById(id);
    if (!persona) return createMockResponse({ message: 'No encontrado' }, 404);
    return createMockResponse(persona);
  }
  
  if (url.match(/\/Persona\/Crear/i) && method === 'POST') {
    const newPersona = demoStore.createPersona(data);
    return createMockResponse(newPersona, 201);
  }
  
  if (url.match(/\/Persona\/Actualizar\/(\d+)/i) && method === 'PUT') {
    const id = parseInt(url.match(/\/Persona\/Actualizar\/(\d+)/i)![1]);
    const updated = demoStore.updatePersona(id, data);
    if (!updated) return createMockResponse({ message: 'No encontrado' }, 404);
    return createMockResponse(updated);
  }
  
  if (url.match(/\/Persona\/Eliminar\/(\d+)/i) && method === 'DELETE') {
    const id = parseInt(url.match(/\/Persona\/Eliminar\/(\d+)/i)![1]);
    demoStore.deletePersona(id);
    return createMockResponse({ message: 'Eliminado' });
  }

  // ═══════════════════════════════════════════════════════════════════
  // SERVICIOS
  // ═══════════════════════════════════════════════════════════════════
  if (url.match(/\/Servicio\/Obtener$/i) && method === 'GET') {
    return createMockResponse(demoStore.getServicios());
  }
  
  if (url.match(/\/Servicio\/Obtener\/(\d+)/i) && method === 'GET') {
    const id = parseInt(url.match(/\/Servicio\/Obtener\/(\d+)/i)![1]);
    const servicio = demoStore.getServicioById(id);
    if (!servicio) return createMockResponse({ message: 'No encontrado' }, 404);
    return createMockResponse(servicio);
  }
  
  if (url.match(/\/Servicio\/Crear/i) && method === 'POST') {
    const newServicio = demoStore.createServicio(data);
    return createMockResponse(newServicio, 201);
  }
  
  if (url.match(/\/Servicio\/Actualizar\/(\d+)/i) && method === 'PUT') {
    const id = parseInt(url.match(/\/Servicio\/Actualizar\/(\d+)/i)![1]);
    const updated = demoStore.updateServicio(id, data);
    if (!updated) return createMockResponse({ message: 'No encontrado' }, 404);
    return createMockResponse(updated);
  }
  
  if (url.match(/\/Servicio\/Eliminar\/(\d+)/i) && method === 'DELETE') {
    const id = parseInt(url.match(/\/Servicio\/Eliminar\/(\d+)/i)![1]);
    demoStore.deleteServicio(id);
    return createMockResponse({ message: 'Eliminado' });
  }

  // ═══════════════════════════════════════════════════════════════════
  // CONFIGURACIÓN DE SERVICIOS
  // ═══════════════════════════════════════════════════════════════════
  if (url.match(/\/ConfiguracionServicio\/Obtener$/i) && method === 'GET') {
    return createMockResponse(demoStore.getConfiguracionesServicio());
  }

  if (url.match(/\/ConfiguracionServicio\/Obtener\/(\d+)/i) && method === 'GET') {
    const id = parseInt(url.match(/\/ConfiguracionServicio\/Obtener\/(\d+)/i)![1]);
    const config = demoStore.getConfiguracionById(id);
    if (!config) return createMockResponse({ message: 'No encontrado' }, 404);
    return createMockResponse(config);
  }

  if (url.match(/\/ConfiguracionServicio\/Crear/i) && method === 'POST') {
    const newConfig = demoStore.createConfiguracionServicio(data);
    return createMockResponse(newConfig, 201);
  }

  if (url.match(/\/ConfiguracionServicio\/Actualizar\/(\d+)/i) && method === 'PUT') {
    const id = parseInt(url.match(/\/ConfiguracionServicio\/Actualizar\/(\d+)/i)![1]);
    const updated = demoStore.updateConfiguracionServicio(id, data);
    if (!updated) return createMockResponse({ message: 'No encontrado' }, 404);
    return createMockResponse(updated);
  }

  if (url.match(/\/ConfiguracionServicio\/Eliminar\/(\d+)/i) && method === 'DELETE') {
    const id = parseInt(url.match(/\/ConfiguracionServicio\/Eliminar\/(\d+)/i)![1]);
    demoStore.deleteConfiguracionServicio(id);
    return createMockResponse({ message: 'Eliminado' });
  }

  // ═══════════════════════════════════════════════════════════════════
  // REGISTRO DE SERVICIOS
  // ═══════════════════════════════════════════════════════════════════
  if (url.match(/\/RegistroServicio\/ObtenerRegistros/i) && method === 'GET') {
    const fecha = queryParams.fecha || queryParams.Fecha;
    return createMockResponse(demoStore.getRegistrosServicio(fecha));
  }

  if (url.match(/\/RegistroServicio\/ObtenerPorPersona\/(\d+)/i) && method === 'GET') {
    const id = parseInt(url.match(/\/RegistroServicio\/ObtenerPorPersona\/(\d+)/i)![1]);
    const registros = demoStore.getRegistrosServicio().filter(r => r.personaId === id && !r.liquidado);
    return createMockResponse(registros);
  }

  if (url.match(/\/RegistroServicio\/Guardar/i) && method === 'POST') {
    const registros = Array.isArray(data) ? data : [data];
    const creados = registros.map((r: any) => demoStore.createRegistroServicio(r));
    return createMockResponse(creados, 201);
  }

  if (url.match(/\/RegistroServicio\/Confirmar\/(\d+)/i)) {
    const id = parseInt(url.match(/\/RegistroServicio\/Confirmar\/(\d+)/i)![1]);
    const registro = demoStore.confirmarRegistro(id);
    if (!registro) return createMockResponse({ message: 'No encontrado' }, 404);
    return createMockResponse(registro);
  }

  if (url.match(/\/RegistroServicio\/Eliminar\/(\d+)/i) && method === 'DELETE') {
    const id = parseInt(url.match(/\/RegistroServicio\/Eliminar\/(\d+)/i)![1]);
    demoStore.deleteRegistroServicio(id);
    return createMockResponse({ message: 'Eliminado' });
  }

  // ═══════════════════════════════════════════════════════════════════
  // EGRESOS
  // ═══════════════════════════════════════════════════════════════════
  if (url.match(/\/EgresosEmpresa\/ObtenerEgresosPorRango/i) && method === 'GET') {
    return createMockResponse(demoStore.getEgresos());
  }

  if (url.match(/\/EgresosEmpresa\/ObtenerEgresosPorPersona/i) && method === 'GET') {
    const personaId = parseInt(queryParams.personaId || '0');
    const egresos = demoStore.getEgresos().filter(e => e.personaId === personaId);
    return createMockResponse(egresos);
  }

  if (url.match(/\/EgresosEmpresa\/RegistrarEgreso/i) && method === 'POST') {
    const persona = demoStore.getPersonaById(data.personaId);
    const newEgreso = demoStore.createEgreso({
      ...data,
      nombrePersona: persona ? `${persona.nombre} ${persona.apellido}` : 'Desconocido',
      empresaId: 999,
    });
    return createMockResponse(newEgreso, 201);
  }

  if (url.match(/\/EgresosEmpresa\/Eliminar\/(\d+)/i) && method === 'DELETE') {
    const id = parseInt(url.match(/\/EgresosEmpresa\/Eliminar\/(\d+)/i)![1]);
    demoStore.deleteEgreso(id);
    return createMockResponse({ message: 'Eliminado' });
  }

  // ═══════════════════════════════════════════════════════════════════
  // CONTABILIDAD
  // ═══════════════════════════════════════════════════════════════════
  
  // Pagos pendientes (últimos días)
  if (url.match(/\/Contabilidad\/PagosUltimosDias/i) && method === 'GET') {
    return createMockResponse(demoStore.getContabilidad());
  }

  // Detalle de servicios por persona
  if (url.match(/\/Contabilidad\/DetalleServiciosPorPersona\/(\d+)/i) && method === 'GET') {
    const id = parseInt(url.match(/\/Contabilidad\/DetalleServiciosPorPersona\/(\d+)/i)![1]);
    return createMockResponse(demoStore.getDetalleServicioPersona(id));
  }

  // Liquidar persona
  if (url.match(/\/Contabilidad\/LiquidarPersona/i) && method === 'POST') {
    const personaId = parseInt(queryParams.personaId || '0');
    demoStore.liquidarPersona(personaId);
    return createMockResponse({ message: 'Persona liquidada correctamente' });
  }

  // Historial de liquidaciones
  if (url.match(/\/Contabilidad\/HistorialLiquidaciones/i) && method === 'GET') {
    return createMockResponse(demoStore.getHistorialLiquidaciones());
  }

  // Historial de ingresos de empresa
  if (url.match(/\/Contabilidad\/HistorialIngresosEmpresa/i) && method === 'GET') {
    return createMockResponse(demoStore.getHistorialIngresos());
  }

  // Consolidado de forma de pago
  if (url.match(/\/Contabilidad\/ConsolidadoFormaPago/i) && method === 'GET') {
    return createMockResponse(demoStore.getConsolidadoFormaPago());
  }

  // Consolidado de ingresos y egresos
  if (url.match(/\/Contabilidad\/ConsolidadoIngresosEgresos/i) && method === 'GET') {
    return createMockResponse(demoStore.getConsolidadoIngresosEgresos());
  }

  // ═══════════════════════════════════════════════════════════════════
  // CONFIGURACIÓN GENERAL
  // ═══════════════════════════════════════════════════════════════════
  if (url.match(/\/ConfiguracionGeneral\/Obtener/i) && method === 'GET') {
    return createMockResponse(demoStore.getConfiguracionGeneral());
  }

  if (url.match(/\/ConfiguracionGeneral\/Crear/i) && method === 'POST') {
    return createMockResponse({ ...demoStore.getConfiguracionGeneral(), ...data }, 201);
  }

  if (url.match(/\/ConfiguracionGeneral\/Actualizar/i) && method === 'PUT') {
    return createMockResponse({ ...demoStore.getConfiguracionGeneral(), ...data });
  }

  // ═══════════════════════════════════════════════════════════════════
  // EVIDENCIAS (simulado)
  // ═══════════════════════════════════════════════════════════════════
  if (url.match(/\/Evidencia/i)) {
    if (method === 'GET') {
      return createMockResponse([]);
    }
    if (method === 'POST') {
      return createMockResponse({ 
        id: Date.now(), 
        urlEvidencia: 'https://demo.example.com/evidencia-demo.jpg',
        message: 'Evidencia subida (simulación)' 
      }, 201);
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // FALLBACK - Ruta no manejada
  // ═══════════════════════════════════════════════════════════════════
  console.warn(`[DEMO API] ⚠️ Ruta no manejada: ${method} ${url}`);
  return createMockResponse([], 200);
}

// Verificar si estamos en modo demo al iniciar la app
export async function checkDemoMode(): Promise<boolean> {
  return getDemoMode();
}

// Guardar estado demo en AsyncStorage (alias de setDemoMode)
export async function saveDemoMode(value: boolean): Promise<void> {
  await setDemoMode(value);
}
