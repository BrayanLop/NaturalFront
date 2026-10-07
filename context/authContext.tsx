import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { checkDemoMode, saveDemoMode } from '../app/api/demoApi';
import { DEMO_USER } from '../app/api/demoData';
import { limpiarSesionStorage, registrarHandlerSesionExpirada } from '../utils/sessionEvents';

type Usuario = {
  id: number;
  idUsuario?: number; // Nuevo campo para el idUsuario
  nombre: string;
  empresaId: number;
  rol: string;
  token?: string; // Token JWT del backend
  nombreEmpresa?: string; // Nombre de la empresa
};

type AuthContextType = {
  usuario: Usuario | null;
  cargando: boolean;
  isDemo: boolean;
  login: (datos: Usuario) => Promise<void>;
  loginDemo: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    const cargarDatos = async () => {
      // Verificar si estamos en modo demo
      const demoMode = await checkDemoMode();
      setIsDemo(demoMode);
      
      const datos = await AsyncStorage.getItem('usuario');
      if (datos) setUsuario(JSON.parse(datos));
      setCargando(false);
    };
    cargarDatos();
  }, []);

  const login = async (datos: Usuario) => {
    // Primero se persiste la sesión (incluido el token) y solo después se actualiza el estado:
    // setUsuario muestra las pantallas, que piden datos de inmediato y necesitan el token ya guardado.
    await saveDemoMode(false);
    const claves: [string, string][] = [
      ['usuario', JSON.stringify(datos)],
      ['empresaId', String(datos.empresaId)],
      ['rol', String(datos.rol)],
      ['personaId', String(datos.id)],
    ];
    if (datos.token) {
      claves.push(['token', datos.token]);
    }
    await AsyncStorage.multiSet(claves);

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
    await AsyncStorage.setItem('usuario', JSON.stringify(datosDemo));
    await AsyncStorage.setItem('empresaId', String(datosDemo.empresaId));
    await AsyncStorage.setItem('rol', String(datosDemo.rol));
    await AsyncStorage.setItem('personaId', String(datosDemo.id));
    await AsyncStorage.setItem('token', datosDemo.token!);
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

  // Si el backend responde 401 (token vencido), el interceptor de api.ts cierra la sesión con este logout.
  useEffect(() => registrarHandlerSesionExpirada(logout), []);

  return (
    <AuthContext.Provider value={{ usuario, login, loginDemo, logout, cargando, isDemo }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
