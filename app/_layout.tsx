import { Slot } from 'expo-router';
import { Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../context/authContext';
import { CitasAuthProvider } from '../context/citasAuthContext';

// Load Bootstrap CSS for web so HTML elements get Bootstrap styling
if (Platform.OS === 'web') {
  // require is used to ensure the CSS is bundled by the web packager
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require('bootstrap/dist/css/bootstrap.min.css');
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <CitasAuthProvider>
          <Slot />
        </CitasAuthProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
