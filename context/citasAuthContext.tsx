import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { citasClienteApi, registrarHandlerClienteCitasExpirado } from '../app/api/citasApi';
import { CITAS_KEYS, CITAS_STORAGE_KEYS } from '../app/api/citasConfig';
import type {
  ClienteAuthResponse,
  LoginClienteRequest,
  RegistroClienteRequest,
  SelectEmpresaResponse,
} from '../app/api/modelos/citas';
import { logger } from '../utils/logger';

/**
 * Sesión de CLIENTE externo del módulo de Citas. Totalmente separada de la sesión de Natural
 * (`AuthContext`): usa sus propias claves `citas_*` y nunca toca 'token'/'usuario' de Natural.
 *
 * Flujo: register/login -> token sin empresa -> select-empresa -> token con tenant.
 */
export type CitasClienteSession = {
  personaId: number;
  nombre: string;
  /** null hasta que elige empresa. */
  tenant: string | null;
  empresaNombre: string | null;
  /** Id del Usuario del cliente dentro del tenant. */
  userId: number | null;
};

type CitasAuthContextType = {
  session: CitasClienteSession | null;
  cargando: boolean;
  registrar: (datos: RegistroClienteRequest) => Promise<void>;
  login: (datos: LoginClienteRequest) => Promise<void>;
  seleccionarEmpresa: (tenant: string) => Promise<void>;
  /** Vuelve a la elección de empresa conservando el login. */
  cambiarEmpresa: () => Promise<void>;
  logout: () => Promise<void>;
};

const CitasAuthContext = createContext<CitasAuthContextType>({} as CitasAuthContextType);

function vencido(expiraUtc: string | null): boolean {
  if (!expiraUtc) return false;
  const t = Date.parse(expiraUtc);
  return Number.isFinite(t) && t <= Date.now();
}

export const CitasAuthProvider = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const [session, setSession] = useState<CitasClienteSession | null>(null);
  const [cargando, setCargando] = useState(true);

  const limpiar = useCallback(async () => {
    setSession(null);
    await AsyncStorage.multiRemove(CITAS_STORAGE_KEYS);
  }, []);

  useEffect(() => {
    const cargar = async () => {
      try {
        const pares = await AsyncStorage.multiGet(CITAS_STORAGE_KEYS);
        const v = Object.fromEntries(pares) as Record<string, string | null>;
        if (!v[CITAS_KEYS.token] || !v[CITAS_KEYS.personaId] || vencido(v[CITAS_KEYS.expiraUtc])) {
          await AsyncStorage.multiRemove(CITAS_STORAGE_KEYS);
          return;
        }
        setSession({
          personaId: Number(v[CITAS_KEYS.personaId]),
          nombre: v[CITAS_KEYS.nombre] ?? '',
          tenant: v[CITAS_KEYS.tenant] || null,
          empresaNombre: v[CITAS_KEYS.empresaNombre] || null,
          userId: v[CITAS_KEYS.userId] ? Number(v[CITAS_KEYS.userId]) : null,
        });
      } catch (e) {
        logger.error('[Citas] Error cargando la sesión de cliente', e);
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, []);

  const guardarLogin = async (data: ClienteAuthResponse) => {
    // Un login nuevo descarta la empresa elegida antes.
    await AsyncStorage.multiRemove(CITAS_STORAGE_KEYS);
    await AsyncStorage.multiSet([
      [CITAS_KEYS.token, data.token],
      [CITAS_KEYS.tokenLogin, data.token],
      [CITAS_KEYS.expiraUtc, data.expiraUtc ?? ''],
      [CITAS_KEYS.personaId, String(data.personaId)],
      [CITAS_KEYS.nombre, data.nombre ?? ''],
    ]);
    setSession({ personaId: data.personaId, nombre: data.nombre ?? '', tenant: null, empresaNombre: null, userId: null });
  };

  const registrar = async (datos: RegistroClienteRequest) => {
    const { data } = await citasClienteApi.post<ClienteAuthResponse>('/Auth/register', datos);
    await guardarLogin(data);
  };

  const login = async (datos: LoginClienteRequest) => {
    const { data } = await citasClienteApi.post<ClienteAuthResponse>('/Auth/login', datos);
    await guardarLogin(data);
  };

  const seleccionarEmpresa = async (tenant: string) => {
    // select-empresa se pide con el token de login (sin empresa).
    const tokenLogin = await AsyncStorage.getItem(CITAS_KEYS.tokenLogin);
    const { data } = await citasClienteApi.post<SelectEmpresaResponse>(
      '/Auth/select-empresa',
      { tenant },
      tokenLogin ? { headers: { Authorization: `Bearer ${tokenLogin}` } } : undefined
    );
    await AsyncStorage.multiSet([
      [CITAS_KEYS.token, data.token],
      [CITAS_KEYS.expiraUtc, data.expiraUtc ?? ''],
      [CITAS_KEYS.tenant, data.tenant],
      [CITAS_KEYS.empresaNombre, data.empresaNombre ?? ''],
      [CITAS_KEYS.userId, String(data.userId)],
    ]);
    setSession((prev) =>
      prev ? { ...prev, tenant: data.tenant, empresaNombre: data.empresaNombre, userId: data.userId } : prev
    );
  };

  const cambiarEmpresa = async () => {
    const tokenLogin = await AsyncStorage.getItem(CITAS_KEYS.tokenLogin);
    if (!tokenLogin) {
      await logout();
      return;
    }
    await AsyncStorage.multiRemove([CITAS_KEYS.tenant, CITAS_KEYS.empresaNombre, CITAS_KEYS.userId]);
    await AsyncStorage.setItem(CITAS_KEYS.token, tokenLogin);
    setSession((prev) => (prev ? { ...prev, tenant: null, empresaNombre: null, userId: null } : prev));
  };

  const logout = async () => {
    await limpiar();
    try {
      router.replace('/citas/login');
    } catch {
      // ignorar errores de navegación
    }
  };

  // Un 401 de Citas con token de cliente cierra solo esta sesión (no la de Natural).
  useEffect(() => registrarHandlerClienteCitasExpirado(logout), []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <CitasAuthContext.Provider
      value={{ session, cargando, registrar, login, seleccionarEmpresa, cambiarEmpresa, logout }}
    >
      {children}
    </CitasAuthContext.Provider>
  );
};

export const useCitasAuth = () => useContext(CitasAuthContext);
