import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef } from 'react';

interface UseFetchOnFocusOptions<T> {
  fetchFunction: () => Promise<T>;
  onSuccess?: (data: T) => void;
  onError?: (error: any) => void;
  dependencies?: any[];
}

export function useFetchOnFocus<T>({
  fetchFunction,
  onSuccess,
  onError,
  dependencies = [],
}: UseFetchOnFocusOptions<T>) {
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      const fetch = async () => {
        try {
          const data = await fetchFunction();
          if (isMountedRef.current && onSuccess) {
            onSuccess(data);
          }
        } catch (error) {
          if (isMountedRef.current && onError) {
            onError(error);
          }
        }
      };

      fetch();
    }, [fetchFunction, onSuccess, onError, ...dependencies])
  );
}
