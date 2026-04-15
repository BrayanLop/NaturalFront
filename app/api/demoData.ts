/**
 * Datos de demostración para prueba gratuita
 * Estos datos se mantienen en memoria y no se persisten en la BD
 */

import { ConfiguracionServicio } from './modelos/configuracionServicio';
import { EgresoEmpresa } from './modelos/egreso';
import { Persona } from './modelos/persona';
import { RegistroServicio } from './modelos/registroServicio';
import { Servicio } from './modelos/servicio';

// Usuario demo
export const DEMO_USER = {
  id: 1,
  idUsuario: 999,
  nombre: 'Usuario Demo',
  empresaId: 999,
  rol: '01', // Admin
  nombreEmpresa: 'Empresa de Prueba',
  token: 'demo-token-12345',
};

// Datos iniciales que se copian al iniciar modo demo
const INITIAL_PERSONAS: Persona[] = [
  {
    id: 1,
    nombre: 'María',
    apellido: 'González',
    cedula: '1234567890',
    residencia: 'Calle 123 #45-67',
    email: 'maria@demo.com',
    edad: 28,
    celular: '3001234567',
    fechaNacimiento: '1996-05-15',
    rol: '02', // Trabajador
    empresaId: 999,
  },
  {
    id: 2,
    nombre: 'Carlos',
    apellido: 'Rodríguez',
    cedula: '0987654321',
    residencia: 'Avenida 456 #78-90',
    email: 'carlos@demo.com',
    edad: 35,
    celular: '3109876543',
    fechaNacimiento: '1989-08-22',
    rol: '02', // Trabajador
    empresaId: 999,
  },
  {
    id: 3,
    nombre: 'Ana',
    apellido: 'Martínez',
    cedula: '5678901234',
    residencia: 'Carrera 789 #12-34',
    email: 'ana@demo.com',
    edad: 32,
    celular: '3205678901',
    fechaNacimiento: '1992-03-10',
    rol: '02', // Trabajador
    empresaId: 999,
  },
];

const INITIAL_SERVICIOS: Servicio[] = [
  {
    id: 1,
    nombre: 'Corte de cabello',
    descripcion: 'Corte de cabello profesional',
    precio: 25000,
    disponible: true,
    fechaCreacion: new Date().toISOString(),
  },
  {
    id: 2,
    nombre: 'Manicure',
    descripcion: 'Manicure completo con esmaltado',
    precio: 30000,
    disponible: true,
    fechaCreacion: new Date().toISOString(),
  },
  {
    id: 3,
    nombre: 'Pedicure',
    descripcion: 'Pedicure spa completo',
    precio: 35000,
    disponible: true,
    fechaCreacion: new Date().toISOString(),
  },
  {
    id: 4,
    nombre: 'Tinte',
    descripcion: 'Aplicación de tinte profesional',
    precio: 80000,
    disponible: true,
    fechaCreacion: new Date().toISOString(),
  },
  {
    id: 5,
    nombre: 'Alisado',
    descripcion: 'Tratamiento de alisado keratina',
    precio: 150000,
    disponible: true,
    fechaCreacion: new Date().toISOString(),
  },
];

const INITIAL_CONFIG_SERVICIOS: ConfiguracionServicio[] = [
  { id: 1, servicioId: 1, nombreServicio: 'Corte de cabello', porcentajeTrabajador: 50, porcentajeEmpresa: 50, estado: true, empresaId: 999 },
  { id: 2, servicioId: 2, nombreServicio: 'Manicure', porcentajeTrabajador: 60, porcentajeEmpresa: 40, estado: true, empresaId: 999 },
  { id: 3, servicioId: 3, nombreServicio: 'Pedicure', porcentajeTrabajador: 60, porcentajeEmpresa: 40, estado: true, empresaId: 999 },
  { id: 4, servicioId: 4, nombreServicio: 'Tinte', porcentajeTrabajador: 40, porcentajeEmpresa: 60, estado: true, empresaId: 999 },
  { id: 5, servicioId: 5, nombreServicio: 'Alisado', porcentajeTrabajador: 45, porcentajeEmpresa: 55, estado: true, empresaId: 999 },
];

// Generar registros de servicio de ejemplo
function generarRegistrosIniciales(): RegistroServicio[] {
  const hoy = new Date();
  const registros: RegistroServicio[] = [];
  
  // Generar algunos registros de los últimos días
  for (let i = 0; i < 10; i++) {
    const fecha = new Date(hoy);
    fecha.setDate(fecha.getDate() - Math.floor(Math.random() * 7));
    
    const personaIndex = Math.floor(Math.random() * INITIAL_PERSONAS.length);
    const servicioIndex = Math.floor(Math.random() * INITIAL_SERVICIOS.length);
    const formasPago: ('T' | 'E')[] = ['T', 'E'];
    
    registros.push({
      id: i + 1,
      personaId: INITIAL_PERSONAS[personaIndex].id,
      servicioId: INITIAL_SERVICIOS[servicioIndex].id,
      nombrePersona: `${INITIAL_PERSONAS[personaIndex].nombre} ${INITIAL_PERSONAS[personaIndex].apellido}`,
      nombreServicio: INITIAL_SERVICIOS[servicioIndex].nombre,
      fechaServicio: fecha.toISOString(),
      confirmado: Math.random() > 0.3,
      liquidado: false,
      empresaId: 999,
      formaPago: formasPago[Math.floor(Math.random() * formasPago.length)],
    });
  }
  
  return registros;
}

const INITIAL_EGRESOS: EgresoEmpresa[] = [
  {
    egresoId: 1,
    empresaId: 999,
    personaId: 1,
    nombrePersona: 'María González',
    valorEgreso: 50000,
    motivo: 'Adelanto de nómina',
    fechaRegistro: new Date().toISOString(),
    seDescuenta: true,
  },
];

// Clase para manejar el estado demo en memoria
class DemoDataStore {
  private personas: Persona[] = [];
  private servicios: Servicio[] = [];
  private registrosServicio: RegistroServicio[] = [];
  private configuracionesServicio: ConfiguracionServicio[] = [];
  private egresos: EgresoEmpresa[] = [];
  private nextIds = {
    persona: 4,
    servicio: 6,
    registro: 11,
    configuracion: 6,
    egreso: 2,
  };

  constructor() {
    this.reset();
  }

  // Reiniciar todos los datos a su estado inicial
  reset() {
    this.personas = JSON.parse(JSON.stringify(INITIAL_PERSONAS));
    this.servicios = JSON.parse(JSON.stringify(INITIAL_SERVICIOS));
    this.registrosServicio = generarRegistrosIniciales();
    this.configuracionesServicio = JSON.parse(JSON.stringify(INITIAL_CONFIG_SERVICIOS));
    this.egresos = JSON.parse(JSON.stringify(INITIAL_EGRESOS));
    this.nextIds = { persona: 4, servicio: 6, registro: 11, configuracion: 6, egreso: 2 };
  }

  // === PERSONAS ===
  getPersonas(): Persona[] {
    return this.personas;
  }

  getPersonaById(id: number): Persona | undefined {
    return this.personas.find(p => p.id === id);
  }

  createPersona(data: Omit<Persona, 'id'>): Persona {
    const newPersona: Persona = { ...data, id: this.nextIds.persona++, empresaId: 999 };
    this.personas.push(newPersona);
    return newPersona;
  }

  updatePersona(id: number, data: Partial<Persona>): Persona | null {
    const index = this.personas.findIndex(p => p.id === id);
    if (index === -1) return null;
    this.personas[index] = { ...this.personas[index], ...data };
    return this.personas[index];
  }

  deletePersona(id: number): boolean {
    const index = this.personas.findIndex(p => p.id === id);
    if (index === -1) return false;
    this.personas.splice(index, 1);
    return true;
  }

  // === SERVICIOS ===
  getServicios(): Servicio[] {
    return this.servicios;
  }

  getServicioById(id: number): Servicio | undefined {
    return this.servicios.find(s => s.id === id);
  }

  createServicio(data: Omit<Servicio, 'id' | 'fechaCreacion'>): Servicio {
    const newServicio: Servicio = { 
      ...data, 
      id: this.nextIds.servicio++,
      fechaCreacion: new Date().toISOString()
    };
    this.servicios.push(newServicio);
    return newServicio;
  }

  updateServicio(id: number, data: Partial<Servicio>): Servicio | null {
    const index = this.servicios.findIndex(s => s.id === id);
    if (index === -1) return null;
    this.servicios[index] = { ...this.servicios[index], ...data };
    return this.servicios[index];
  }

  deleteServicio(id: number): boolean {
    const index = this.servicios.findIndex(s => s.id === id);
    if (index === -1) return false;
    this.servicios.splice(index, 1);
    return true;
  }

  // === REGISTROS DE SERVICIO ===
  getRegistrosServicio(fecha?: string): RegistroServicio[] {
    if (!fecha) return this.registrosServicio;
    return this.registrosServicio.filter(r => 
      r.fechaServicio.split('T')[0] === fecha.split('T')[0]
    );
  }

  getRegistroById(id: number): RegistroServicio | undefined {
    return this.registrosServicio.find(r => r.id === id);
  }

  createRegistroServicio(data: { personaId: number; servicioId: number; fechaServicio: string; formaPago?: string }): RegistroServicio {
    const persona = this.getPersonaById(data.personaId);
    const servicio = this.getServicioById(data.servicioId);
    
    const newRegistro: RegistroServicio = {
      id: this.nextIds.registro++,
      personaId: data.personaId,
      servicioId: data.servicioId,
      nombrePersona: persona ? `${persona.nombre} ${persona.apellido}` : 'Desconocido',
      nombreServicio: servicio?.nombre || 'Desconocido',
      fechaServicio: data.fechaServicio,
      confirmado: false,
      liquidado: false,
      empresaId: 999,
      formaPago: data.formaPago,
    };
    this.registrosServicio.push(newRegistro);
    return newRegistro;
  }

  confirmarRegistro(id: number): RegistroServicio | null {
    const registro = this.registrosServicio.find(r => r.id === id);
    if (!registro) return null;
    registro.confirmado = true;
    return registro;
  }

  deleteRegistroServicio(id: number): boolean {
    const index = this.registrosServicio.findIndex(r => r.id === id);
    if (index === -1) return false;
    this.registrosServicio.splice(index, 1);
    return true;
  }

  // === CONFIGURACIÓN DE SERVICIOS ===
  getConfiguracionesServicio(): ConfiguracionServicio[] {
    return this.configuracionesServicio;
  }

  getConfiguracionById(id: number): ConfiguracionServicio | undefined {
    return this.configuracionesServicio.find(c => c.id === id);
  }

  createConfiguracionServicio(data: Omit<ConfiguracionServicio, 'id'>): ConfiguracionServicio {
    const servicio = this.getServicioById(data.servicioId);
    const newConfig: ConfiguracionServicio = {
      ...data,
      id: this.nextIds.configuracion++,
      nombreServicio: servicio?.nombre,
      empresaId: 999,
    };
    this.configuracionesServicio.push(newConfig);
    return newConfig;
  }

  updateConfiguracionServicio(id: number, data: Partial<ConfiguracionServicio>): ConfiguracionServicio | null {
    const index = this.configuracionesServicio.findIndex(c => c.id === id);
    if (index === -1) return null;
    this.configuracionesServicio[index] = { ...this.configuracionesServicio[index], ...data };
    return this.configuracionesServicio[index];
  }

  deleteConfiguracionServicio(id: number): boolean {
    const index = this.configuracionesServicio.findIndex(c => c.id === id);
    if (index === -1) return false;
    this.configuracionesServicio.splice(index, 1);
    return true;
  }

  // === EGRESOS ===
  getEgresos(): EgresoEmpresa[] {
    return this.egresos;
  }

  createEgreso(data: Omit<EgresoEmpresa, 'egresoId'>): EgresoEmpresa {
    const newEgreso: EgresoEmpresa = {
      ...data,
      egresoId: this.nextIds.egreso++,
      fechaRegistro: new Date().toISOString(),
    };
    this.egresos.push(newEgreso);
    return newEgreso;
  }

  deleteEgreso(id: number): boolean {
    const index = this.egresos.findIndex(e => e.egresoId === id);
    if (index === -1) return false;
    this.egresos.splice(index, 1);
    return true;
  }

  // === CONTABILIDAD ===
  getContabilidad(): any[] {
    // Estructura que espera el componente:
    // { personaId, nombrePersona, totalPagado, totalSinConfirmar, servicios: [{nombre, cantidad}] }
    
    const contabilidadMap = new Map<number, {
      personaId: number;
      nombrePersona: string;
      totalPagado: number;
      totalSinConfirmar: number;
      serviciosMap: Map<string, number>;
    }>();
    
    this.registrosServicio
      .filter(r => !r.liquidado)
      .forEach(registro => {
        const servicio = this.servicios.find(s => s.id === registro.servicioId);
        const config = this.configuracionesServicio.find(c => c.servicioId === registro.servicioId);
        const precio = servicio?.precio || 0;
        const porcentaje = config?.porcentajeTrabajador || 50;
        const ganancia = (precio * porcentaje) / 100;
        const nombreServicio = registro.nombreServicio || servicio?.nombre || 'Servicio';
        
        const existing = contabilidadMap.get(registro.personaId);
        if (existing) {
          if (registro.confirmado) {
            existing.totalPagado += ganancia;
          } else {
            existing.totalSinConfirmar += ganancia;
          }
          existing.serviciosMap.set(nombreServicio, (existing.serviciosMap.get(nombreServicio) || 0) + 1);
        } else {
          const serviciosMap = new Map<string, number>();
          serviciosMap.set(nombreServicio, 1);
          contabilidadMap.set(registro.personaId, {
            personaId: registro.personaId,
            nombrePersona: registro.nombrePersona,
            totalPagado: registro.confirmado ? ganancia : 0,
            totalSinConfirmar: registro.confirmado ? 0 : ganancia,
            serviciosMap,
          });
        }
      });
    
    return Array.from(contabilidadMap.values()).map(item => ({
      personaId: item.personaId,
      nombrePersona: item.nombrePersona,
      totalPagado: item.totalPagado,
      totalSinConfirmar: item.totalSinConfirmar,
      servicios: Array.from(item.serviciosMap.entries()).map(([nombre, cantidad]) => ({
        nombre,
        cantidad,
      })),
    }));
  }

  getDetalleServicioPersona(personaId: number): any[] {
    // Agrupar registros por fecha
    const registrosFiltrados = this.registrosServicio
      .filter(r => r.personaId === personaId && r.confirmado && !r.liquidado);
    
    const porFecha = new Map<string, any[]>();
    
    registrosFiltrados.forEach(registro => {
      const fecha = registro.fechaServicio.split('T')[0];
      const servicio = this.servicios.find(s => s.id === registro.servicioId);
      const config = this.configuracionesServicio.find(c => c.servicioId === registro.servicioId);
      const precio = servicio?.precio || 0;
      const porcentaje = config?.porcentajeTrabajador || 50;
      const valorTrabajador = (precio * porcentaje) / 100;
      
      const servicioDetalle = {
        nombreServicio: registro.nombreServicio,
        hora: registro.fechaServicio,
        confirmado: registro.confirmado,
        registroServicioId: registro.id,
        RegistroServicioId: registro.id,
        valorTrabajador,
      };
      
      if (!porFecha.has(fecha)) {
        porFecha.set(fecha, []);
      }
      porFecha.get(fecha)!.push(servicioDetalle);
    });

    // Convertir a array con la estructura esperada
    return Array.from(porFecha.entries()).map(([fecha, servicios]) => {
      const liquidacionServicios = servicios.reduce((acc, s) => acc + (s.valorTrabajador || 0), 0);
      return {
        fecha,
        totalServicios: servicios.length,
        servicios,
        LiquidacionServicios: liquidacionServicios,
        liquidacionServicios,
      };
    }).sort((a, b) => b.fecha.localeCompare(a.fecha));
  }

  liquidarPersona(personaId: number): boolean {
    this.registrosServicio
      .filter(r => r.personaId === personaId && r.confirmado && !r.liquidado)
      .forEach(r => { r.liquidado = true; });
    return true;
  }

  // === CONSOLIDADOS ===
  getConsolidadoFormaPago(fechaInicio?: string, fechaFin?: string): { 
    cantidadTransferencia: number; 
    totalTransferencia: number; 
    cantidadEfectivo: number; 
    totalEfectivo: number;
  } {
    const registros = this.registrosServicio.filter(r => {
      if (!r.confirmado) return false;
      if (fechaInicio && r.fechaServicio < fechaInicio) return false;
      if (fechaFin && r.fechaServicio > fechaFin) return false;
      return true;
    });

    let cantidadTransferencia = 0;
    let totalTransferencia = 0;
    let cantidadEfectivo = 0;
    let totalEfectivo = 0;

    registros.forEach(r => {
      const servicio = this.servicios.find(s => s.id === r.servicioId);
      const precio = servicio?.precio || 0;
      
      if (r.formaPago === 'T') {
        cantidadTransferencia++;
        totalTransferencia += precio;
      } else if (r.formaPago === 'E') {
        cantidadEfectivo++;
        totalEfectivo += precio;
      }
    });

    return {
      cantidadTransferencia,
      totalTransferencia,
      cantidadEfectivo,
      totalEfectivo,
    };
  }

  getConsolidadoIngresos(fechaInicio?: string, fechaFin?: string): { fecha: string; total: number }[] {
    const registros = this.registrosServicio.filter(r => {
      if (!r.confirmado) return false;
      if (fechaInicio && r.fechaServicio < fechaInicio) return false;
      if (fechaFin && r.fechaServicio > fechaFin) return false;
      return true;
    });

    const map = new Map<string, number>();
    registros.forEach(r => {
      const fecha = r.fechaServicio.split('T')[0];
      const servicio = this.servicios.find(s => s.id === r.servicioId);
      const precio = servicio?.precio || 0;
      
      map.set(fecha, (map.get(fecha) || 0) + precio);
    });

    return Array.from(map.entries())
      .map(([fecha, total]) => ({ fecha, total }))
      .sort((a, b) => a.fecha.localeCompare(b.fecha));
  }

  // === HISTORIAL DE LIQUIDACIONES ===
  getHistorialLiquidaciones(): any[] {
    // Retornar liquidaciones ficticias basadas en registros liquidados
    const liquidados = this.registrosServicio.filter(r => r.liquidado);
    const personasLiquidadas = new Map<number, { nombrePersona: string; total: number; fecha: string }>();
    
    liquidados.forEach(r => {
      const servicio = this.servicios.find(s => s.id === r.servicioId);
      const config = this.configuracionesServicio.find(c => c.servicioId === r.servicioId);
      const precio = servicio?.precio || 0;
      const porcentaje = config?.porcentajeTrabajador || 50;
      const ganancia = (precio * porcentaje) / 100;
      
      const existing = personasLiquidadas.get(r.personaId);
      if (existing) {
        existing.total += ganancia;
      } else {
        personasLiquidadas.set(r.personaId, {
          nombrePersona: r.nombrePersona,
          total: ganancia,
          fecha: new Date().toISOString(),
        });
      }
    });

    return Array.from(personasLiquidadas.entries()).map(([personaId, data]) => ({
      personaId,
      nombrePersona: data.nombrePersona,
      fechaLiquidacion: data.fecha,
      totalPagado: data.total,
    }));
  }

  // === HISTORIAL DE INGRESOS ===
  getHistorialIngresos(): { fecha: string; totalRegistros: number; totalIngresado: number }[] {
    const registros = this.registrosServicio.filter(r => r.confirmado);
    
    // Agrupar por fecha
    const porFecha = new Map<string, { totalRegistros: number; totalIngresado: number }>();
    
    registros.forEach(r => {
      const fecha = r.fechaServicio.split('T')[0];
      const servicio = this.servicios.find(s => s.id === r.servicioId);
      const precio = servicio?.precio || 0;
      
      const existing = porFecha.get(fecha);
      if (existing) {
        existing.totalRegistros++;
        existing.totalIngresado += precio;
      } else {
        porFecha.set(fecha, { totalRegistros: 1, totalIngresado: precio });
      }
    });
    
    return Array.from(porFecha.entries())
      .map(([fecha, data]) => ({ fecha, ...data }))
      .sort((a, b) => b.fecha.localeCompare(a.fecha));
  }

  // === CONSOLIDADO INGRESOS Y EGRESOS ===
  getConsolidadoIngresosEgresos(): any {
    const ingresos = this.registrosServicio
      .filter(r => r.confirmado)
      .reduce((acc, r) => {
        const servicio = this.servicios.find(s => s.id === r.servicioId);
        return acc + (servicio?.precio || 0);
      }, 0);

    const egresos = this.egresos.reduce((acc, e) => acc + e.valorEgreso, 0);

    return {
      totalIngresos: ingresos,
      totalEgresos: egresos,
      consolidado: ingresos - egresos,
      balance: ingresos - egresos, // Mantener ambos por compatibilidad
      detalleIngresos: this.getConsolidadoIngresos(),
      detalleEgresos: this.egresos.map(e => ({
        fecha: e.fechaRegistro,
        monto: e.valorEgreso,
        motivo: e.motivo,
        persona: e.nombrePersona,
      })),
    };
  }

  // === CONFIGURACIÓN GENERAL ===
  getConfiguracionGeneral(): any {
    return {
      id: 1,
      empresaId: 999,
      nombreEmpresa: 'Empresa de Prueba',
      moneda: 'COP',
      direccion: 'Calle Demo 123',
      telefono: '3001234567',
      email: 'demo@empresa.com',
    };
  }
}

// Singleton para mantener el estado durante la sesión demo
export const demoStore = new DemoDataStore();
