import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { createContext, useContext, useEffect, useState } from 'react';

type Usuario = {
  id: number;
  nombre: string;
  empresaId: number;
  rol: string
};

type AuthContextType = {
  usuario: Usuario | null;
  cargando: boolean;
  login: (datos: Usuario) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargarDatos = async () => {
      const datos = await AsyncStorage.getItem('usuario');
      if (datos) setUsuario(JSON.parse(datos));
      setCargando(false);
    };
    cargarDatos();
  }, []);

  const login = async (datos: Usuario) => {
    setUsuario(datos);
    await AsyncStorage.setItem('usuario', JSON.stringify(datos));
    await AsyncStorage.setItem('empresaId', String(datos.empresaId));
    await AsyncStorage.setItem('rol', String(datos.rol));
    await AsyncStorage.setItem('personaId', String(datos.id));
  };

  const logout = async () => {
    setUsuario(null);
    await AsyncStorage.removeItem('usuario');
    await AsyncStorage.removeItem('empresaId');
    await AsyncStorage.removeItem('rol');
    await AsyncStorage.removeItem('personaId');
    try {
      router.replace('/login');
    } catch (e) {
      // ignore routing errors
    }
  };

  return (
    <AuthContext.Provider value={{ usuario, login, logout, cargando }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
