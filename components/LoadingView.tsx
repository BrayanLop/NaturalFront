import { LoadingState } from '@/components/ds';
import { useTheme } from '@/theme';
import React from 'react';
import { ActivityIndicator, View } from 'react-native';

/**
 * Compatibilidad: conserva la API anterior. Con mensaje delega en `LoadingState` del sistema de diseño;
 * sin mensaje muestra solo el indicador. `color` solo se respeta si se indica explícitamente.
 */
interface LoadingViewProps {
  size?: 'small' | 'large';
  color?: string;
  message?: string;
  fullScreen?: boolean;
}

const LoadingView = React.memo(function LoadingView({
  size = 'large',
  color,
  message,
  fullScreen = true,
}: LoadingViewProps) {
  const { tema } = useTheme();
  const c = tema.colores;
  return (
    <View
      style={[
        { justifyContent: 'center', alignItems: 'center' },
        fullScreen && { flex: 1, backgroundColor: c.fondo },
      ]}
    >
      {message || !color ? (
        message ? (
          <LoadingState message={message} />
        ) : (
          <ActivityIndicator size={size} color={c.primarioFuerte} />
        )
      ) : (
        <ActivityIndicator size={size} color={color} />
      )}
    </View>
  );
});

export default LoadingView;
