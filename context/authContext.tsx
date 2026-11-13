import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { checkDemoMode, saveDemoMode } from '../app/api/demoApi';
import { DEMO_USER } from '../app/api/demoData';
import { limpiarSesionStorage, registrarHandlerSesionExpirada } from '../utils/sessionEvents';

/** Presente solo mientras el superadmin está "entrando como" una empresa (modo soporte). */
export type Soporte = {
  expiraEn: string; // ISO UTC: cuando vence el token de soporte
  nombreEmpresa: string;
};

type Usuario = {
  id: number;
  idUsuario?: number; // Nuevo campo para el idUsuario
  nombre: string;
  empresaId: number | null; // null para el superadmin de plataforma (rol 00)
  rol: string;
  token?: string; // Token JWT del backend
  nombreEmpresa?: string; // Nombre de la empresa
  soporte?: Soporte;
};

type AuthContextType = {
  usuario: Usuario | null;
  cargando: boolean;
  isDemo: boolean;
  login: (datos: Usuario) => Promise<void>;
  loginDemo: () => Promise<void>;
  logout: () => Promise<void>;
  /** Cambia la sesión a la del administrador de una empresa guardando la del superadmin. */
  entrarComoSoporte: (datos: Usuario) => Promise<void>;
  /** Vuelve a la sesión del superadmin (o cierra sesión si no hay una guardada). */
  salirDeSoporte: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

const ROL_PLATAFORMA = '00';

/** Persiste la sesión (incluido el token). `empresaId` solo se guarda si la hay: el rol 00 no tiene. */
async function guardarSesion(datos: Usuario): Promise<void> {
  const claves: [string, string][] = [
    ['usuario', JSON.stringify(datos)],
    ['rol', String(datos.rol)],
    ['personaId', String(datos.id)],
  ];
  if (datos.empresaId) claves.push(['empresaId', String(datos.empresaId)]);
  if (datos.token) claves.push(['token', datos.token]);
  await AsyncStorage.multiSet(claves);
  if (!datos.empresaId) await AsyncStorage.removeItem('empresaId');
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  // El handler de 401 se registra una sola vez: consulta el estado actual por ref.
  const usuarioRef = useRef<Usuario | null>(null);
  usuarioRef.current = usuario;

  const restaurarSesionPlataforma = async (): Promise<boolean> => {
    const guardada = await AsyncStorage.getItem('sesionPlataforma');
    if (!guardada) return false;
    const original: Usuario = JSON.parse(guardada);
    await guardarSesion(original);
    await AsyncStorage.removeItem('sesionPlataforma');
    setUsuario(original);
    return true;
  };

  useEffect(() => {
    const cargarDatos = async () => {
      // Verificar si estamos en modo demo
      const demoMode = await checkDemoMode();
      setIsDemo(demoMode);

      const datos = await AsyncStorage.getItem('usuario');
      if (datos) {
        const guardado: Usuario = JSON.parse(datos);
        const vencido = guardado.soporte && new Date(guardado.soporte.expiraEn).getTime() <= Date.now();
        if (vencido && (await restaurarSesionPlataforma())) {
          // Se vuelve a la sesión del superadmin: el token de soporte ya venció.
        } else {
          setUsuario(guardado);
        }
      }
      setCargando(false);
    };
    cargarDatos();
  }, []);

  const login = async (datos: Usuario) => {
    // Primero se persiste la sesión (incluido el token) y solo después se actualiza el estado:
    // setUsuario muestra las pantallas, que piden datos de inmediato y necesitan el token ya guardado.
    await saveDemoMode(false);
    await guardarSesion(datos);
    await AsyncStorage.removeItem('sesionPlataforma');

    // El superadmin guarda su token aparte: Brar lo usa aunque luego entre en modo soporte.
    if (datos.rol === ROL_PLATAFORMA && datos.token) {
      await AsyncStorage.setItem('tokenPlataforma', datos.token);
    } else {
      await AsyncStorage.removeItem('tokenPlataforma');
    }

    setIsDemo(false);
    setUsuario(datos);
  };

  const loginDemo = async () => {
    // Activar modo demo
    await saveDemoMode(true);
    setIsDemo(true);

    // Usar datos del usuario demo
    const datosDemo: Usuario = {
      id: DEMO_USER.id,
      idUsuario: DEMO_USER.idUsuario,
      nombre: DEMO_USER.nombre,
      empresaId: DEMO_USER.empresaId,
      rol: DEMO_USER.rol,
      nombreEmpresa: DEMO_USER.nombreEmpresa,
      token: DEMO_USER.token,
    };

    setUsuario(datosDemo);
    await guardarSesion(datosDemo);
  };

  const logout = async () => {
    setUsuario(null);
    setIsDemo(false);
    await saveDemoMode(false);
    await limpiarSesionStorage();
    try {
      router.replace('/login');
    } catch (e) {
      // ignore routing errors
    }
  };

  const entrarComoSoporte = async (datos: Usuario) => {
    const actual = usuarioRef.current;
    if (!actual || actual.rol !== ROL_PLATAFORMA) return;
    await AsyncStorage.setItem('sesionPlataforma', JSON.stringify(actual));
    await guardarSesion(datos);
    setUsuario(datos);
  };

  const salirDeSoporte = async () => {
    if (await restaurarSesionPlataforma()) {
      try {
        router.replace('/home');
      } catch (e) {
        // ignore routing errors
      }
    } else {
      await logout();
    }
  };

  // Si el backend responde 401 (token vencido), el interceptor de api.ts cierra la sesión con este logout.
  // En modo soporte un 401 solo significa que venció el token de soporte: se vuelve al superadmin.
  useEffect(
    () =>
      registrarHandlerSesionExpirada(async () => {
        if (usuarioRef.current?.soporte) await salirDeSoporte();
        else await logout();
      }),
    []
  );

  // Al vencer el token de soporte se vuelve solo a la sesión del superadmin.
  useEffect(() => {
    if (!usuario?.soporte) return;
    const ms = new Date(usuario.soporte.expiraEn).getTime() - Date.now();
    const temporizador = setTimeout(() => {
      salirDeSoporte();
    }, Math.max(ms, 0));
    return () => clearTimeout(temporizador);
  }, [usuario?.soporte?.expiraEn]);

  return (
    <AuthContext.Provider
      value={{ usuario, login, loginDemo, logout, cargando, isDemo, entrarComoSoporte, salirDeSoporte }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
