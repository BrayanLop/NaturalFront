import { Stack } from 'expo-router';
import { AuthProvider } from '../../context/authContext';

export default function Layout() {
  return (
    <AuthProvider>
      <Stack />
    </AuthProvider>
  );
}
