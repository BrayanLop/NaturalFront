import { handleApiError, logger } from '@/utils/logger';
import { useCallback, useState } from 'react';

interface UseApiCallOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: any) => void;
  showErrorAlert?: boolean;
}

interface UseApiCallReturn<T> {
  data: T | null;
  loading: boolean;
  error: any;
  execute: (...args: any[]) => Promise<T | null>;
  reset: () => void;
}

export function useApiCall<T = any>(
  apiFunction: (...args: any[]) => Promise<{ data: T }>,
  options: UseApiCallOptions<T> = {}
): UseApiCallReturn<T> {
  const { onSuccess, onError, showErrorAlert = true } = options;
  
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  const execute = useCallback(
    async (...args: any[]) => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await apiFunction(...args);
        setData(response.data);
        
        if (onSuccess) {
          onSuccess(response.data);
        }
        
        return response.data;
      } catch (err) {
        logger.error('API call failed:', err);
        setError(err);
        
        if (showErrorAlert) {
          handleApiError(err);
        }
        
        if (onError) {
          onError(err);
        }
        
        return null;
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return { data, loading, error, execute, reset };
}
