import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { checkDemoMode, saveDemoMode } from '../app/api/demoApi';
import { DEMO_USER } from '../app/api/demoData';

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
  isAuthenticated: boolean;
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
    setUsuario(datos);
    setIsDemo(false);
    await saveDemoMode(false);
    await AsyncStorage.setItem('usuario', JSON.stringify(datos));
    await AsyncStorage.setItem('empresaId', String(datos.empresaId));
    await AsyncStorage.setItem('rol', String(datos.rol));
    await AsyncStorage.setItem('personaId', String(datos.id));
    
    // Guardar token JWT si existe
    if (datos.token) {
      await AsyncStorage.setItem('token', datos.token);
    }
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
    await AsyncStorage.removeItem('usuario');
    await AsyncStorage.removeItem('empresaId');
    await AsyncStorage.removeItem('rol');
    await AsyncStorage.removeItem('personaId');
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('isDemo');
    try {
      router.replace('/login');
    } catch (e) {
      // ignore routing errors
    }
  };

  const isAuthenticated = usuario !== null;

  return (
    <AuthContext.Provider value={{ usuario, login, loginDemo, logout, cargando, isDemo, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
