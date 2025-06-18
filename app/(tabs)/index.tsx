import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/authContext';

export default function Index() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  // Espera un ciclo de render para asegurarte de que el layout esté montado
  useEffect(() => {
    const timeout = setTimeout(() => setIsReady(true), 0);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (!isReady) return;

    if (isAuthenticated) {
      router.replace('/(tabs)/home'); // ✅ Ruta real
    } else {
      router.replace('/login');
    }
  }, [isAuthenticated, isReady]);

  return null;
}
