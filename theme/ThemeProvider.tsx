import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import { MODO_OSCURO_ACTIVO } from './config';
import { temaClaro, temaOscuro, type ModoTema, type Tema } from './tokens';

export type Preferencia = 'sistema' | 'claro' | 'oscuro';

interface ContextoTema {
  tema: Tema;
  preferencia: Preferencia;
  setPreferencia: (valor: Preferencia) => Promise<void>;
}

const CLAVE_PREFERENCIA = 'natural.apariencia';

const Contexto = createContext<ContextoTema>({
  tema: temaClaro,
  preferencia: 'sistema',
  setPreferencia: async () => {},
});

function resolverModo(preferencia: Preferencia, sistema: string | null | undefined): ModoTema {
  // Mientras el modo oscuro no esté activado en `config.ts`, la app es siempre clara.
  if (!MODO_OSCURO_ACTIVO) return 'claro';
  if (preferencia === 'claro') return 'claro';
  if (preferencia === 'oscuro') return 'oscuro';
  return sistema === 'dark' ? 'oscuro' : 'claro';
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const sistema = useColorScheme();
  const [preferencia, setPreferenciaState] = useState<Preferencia>('sistema');

  useEffect(() => {
    let activo = true;
    (async () => {
      try {
        const guardada = await AsyncStorage.getItem(CLAVE_PREFERENCIA);
        if (activo && (guardada === 'claro' || guardada === 'oscuro' || guardada === 'sistema')) {
          setPreferenciaState(guardada);
        }
      } catch {
        // Sin almacenamiento: se queda en "sistema".
      }
    })();
    return () => {
      activo = false;
    };
  }, []);

  const setPreferencia = useCallback(async (valor: Preferencia) => {
    setPreferenciaState(valor);
    try {
      await AsyncStorage.setItem(CLAVE_PREFERENCIA, valor);
    } catch {
      // Se mantiene en memoria si no se puede guardar.
    }
  }, []);

  const valor = useMemo<ContextoTema>(() => {
    const modo = resolverModo(preferencia, sistema);
    return {
      tema: modo === 'oscuro' ? temaOscuro : temaClaro,
      preferencia,
      setPreferencia,
    };
  }, [preferencia, sistema, setPreferencia]);

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

/** Fuerza un modo para un subárbol (lo usa el catálogo para ver claro y oscuro a la vez). */
export function ThemeOverride({ modo, children }: { modo: ModoTema; children: React.ReactNode }) {
  const padre = useContext(Contexto);
  const valor = useMemo<ContextoTema>(
    () => ({ ...padre, tema: modo === 'oscuro' ? temaOscuro : temaClaro }),
    [padre, modo]
  );
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useTheme(): ContextoTema {
  return useContext(Contexto);
}
