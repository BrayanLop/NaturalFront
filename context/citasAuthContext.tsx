import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { citasApi } from '../app/api/citasApi';
import { CITAS_KEYS } from '../app/api/citasConfig';
import { CitasMode, UsuarioCita } from '../app/api/modelos/citas';

export type CitasSession = {
  tenant: string;
  empresaNombre: string;
  usuario: string;
  mode: CitasMode;
  token: string;
  /** id del usuario en el backend; para modo cliente es su idCliente. */
  userId: number | null;
};

type LoginParams = {
  tenant: string;
  empresaNombre: string;
  usuario: string;
  mode: CitasMode;
};

type CitasAuthContextType = {
  session: CitasSession | null;
  cargando: boolean;
  login: (params: LoginParams) => Promise<void>;
  logout: () => Promise<void>;
};

const CitasAuthContext = createContext<CitasAuthContextType>({} as CitasAuthContextType);

export const CitasAuthProvider = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const [session, setSession] = useState<CitasSession | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargar = async () => {
      try {
        const token = await AsyncStorage.getItem(CITAS_KEYS.token);
        if (token) {
          const [tenant, empresaNombre, usuario, mode, userId] = await Promise.all([
            AsyncStorage.getItem(CITAS_KEYS.tenant),
            AsyncStorage.getItem(CITAS_KEYS.empresaNombre),
            AsyncStorage.getItem(CITAS_KEYS.usuario),
            AsyncStorage.getItem(CITAS_KEYS.mode),
            AsyncStorage.getItem(CITAS_KEYS.userId),
          ]);
          setSession({
            token,
            tenant: tenant ?? '',
            empresaNombre: empresaNombre ?? '',
            usuario: usuario ?? '',
            mode: (mode as CitasMode) ?? 'cliente',
            userId: userId ? Number(userId) : null,
          });
        }
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, []);

  /**
   * Resuelve el id del usuario en el backend a partir de su nombre.
   * Para clientes, si no existe lo crea automáticamente (el API no liga
   * el token con un usuario, así que lo emparejamos por nombre).
   */
  const resolverUserId = async (usuario: string, mode: CitasMode): Promise<number | null> => {
    try {
      const { data } = await citasApi.get<UsuarioCita[]>('/Usuarios');
      const encontrado = data.find(
        (u) => u.nombreUsuario.trim().toLowerCase() === usuario.trim().toLowerCase()
      );
      if (encontrado) return encontrado.id;

      if (mode === 'cliente') {
        const { data: nuevo } = await citasApi.post<UsuarioCita>('/Usuarios', {
          nombreUsuario: usuario,
        });
        return nuevo.id;
      }
      return null;
    } catch {
      // Si falla la resolución no bloqueamos el login.
      return null;
    }
  };

  const login = async ({ tenant, empresaNombre, usuario, mode }: LoginParams) => {
    // 1) Obtener token (el backend solo valida que el tenant exista y esté activo).
    const { data } = await citasApi.post('/Auth/token', { tenant, usuario });
    const token: string = data.token;

    // 2) Persistir token primero para que el interceptor lo use en las siguientes llamadas.
    await AsyncStorage.setItem(CITAS_KEYS.token, token);

    // 3) Resolver el id del usuario en el backend.
    const userId = await resolverUserId(usuario, mode);

    const nuevaSesion: CitasSession = {
      token,
      tenant,
      empresaNombre,
      usuario,
      mode,
      userId,
    };

    await AsyncStorage.multiSet([
      [CITAS_KEYS.tenant, tenant],
      [CITAS_KEYS.empresaNombre, empresaNombre],
      [CITAS_KEYS.usuario, usuario],
      [CITAS_KEYS.mode, mode],
      [CITAS_KEYS.userId, userId != null ? String(userId) : ''],
    ]);

    setSession(nuevaSesion);
  };

  const logout = async () => {
    setSession(null);
    await AsyncStorage.multiRemove([
      CITAS_KEYS.token,
      CITAS_KEYS.tenant,
      CITAS_KEYS.empresaNombre,
      CITAS_KEYS.usuario,
      CITAS_KEYS.mode,
      CITAS_KEYS.userId,
    ]);
    try {
      router.replace('/citas/login');
    } catch {
      // ignore routing errors
    }
  };

  return (
    <CitasAuthContext.Provider value={{ session, cargando, login, logout }}>
      {children}
    </CitasAuthContext.Provider>
  );
};

export const useCitasAuth = () => useContext(CitasAuthContext);
