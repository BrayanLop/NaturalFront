import { useAuth } from '@/context/authContext';
import * as Crypto from 'expo-crypto';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { api } from '../api/api';

export default function CambiarContrasena() {
  const { usuario } = useAuth();
  const router = useRouter();
  const [contrasenaActual, setContrasenaActual] = useState('');
  const [nuevaContrasena, setNuevaContrasena] = useState('');
  const [confirmarContrasena, setConfirmarContrasena] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCambiarContrasena = async () => {
    // Validaciones
    if (!contrasenaActual || !nuevaContrasena || !confirmarContrasena) {
      const mensaje = 'Todos los campos son obligatorios';
      if (Platform.OS === 'web') {
        window.alert(mensaje);
      } else {
        Alert.alert('Error', mensaje);
      }
      return;
    }

    if (nuevaContrasena !== confirmarContrasena) {
      const mensaje = 'Las contraseñas no coinciden';
      if (Platform.OS === 'web') {
        window.alert(mensaje);
      } else {
        Alert.alert('Error', mensaje);
      }
      return;
    }

    if (nuevaContrasena.length < 6) {
      const mensaje = 'La contraseña debe tener al menos 6 caracteres';
      if (Platform.OS === 'web') {
        window.alert(mensaje);
      } else {
        Alert.alert('Error', mensaje);
      }
      return;
    }

    setLoading(true);
    try {
      // Convertir contraseña a bytes UTF-8
      const encoder = new TextEncoder();
      const passwordBytes = encoder.encode(nuevaContrasena);
      
      // Hashear con SHA256
      const hashBytes = await Crypto.digest(
        Crypto.CryptoDigestAlgorithm.SHA256,
        passwordBytes
      );
      
      // Convertir ArrayBuffer a Base64
      const hashBase64 = btoa(String.fromCharCode(...new Uint8Array(hashBytes)));

      await api.put('Usuario/ActualizarContrasena', {
        usuarioId: usuario?.idUsuario ?? usuario?.id,
        nuevaContrasena: hashBase64,
      });

      const mensaje = 'Contraseña actualizada correctamente';
      if (Platform.OS === 'web') {
        window.alert(mensaje);
      } else {
        Alert.alert('Éxito', mensaje);
      }

      // Limpiar campos
      setContrasenaActual('');
      setNuevaContrasena('');
      setConfirmarContrasena('');
      
      // Volver atrás
      router.back();
    } catch (error: any) {
      console.error('❌ Error al cambiar contraseña:', error);
      const mensaje = error?.response?.data?.message || 'No se pudo cambiar la contraseña';
      if (Platform.OS === 'web') {
        window.alert(mensaje);
      } else {
        Alert.alert('Error', mensaje);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Cambiar contraseña</Text>
        <Text style={styles.subtitle}>Usuario: {usuario?.nombre}</Text>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Contraseña actual</Text>
          <TextInput
            style={styles.input}
            value={contrasenaActual}
            onChangeText={setContrasenaActual}
            secureTextEntry
            placeholder="Ingrese su contraseña actual"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Nueva contraseña</Text>
          <TextInput
            style={styles.input}
            value={nuevaContrasena}
            onChangeText={setNuevaContrasena}
            secureTextEntry
            placeholder="Ingrese su nueva contraseña"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Confirmar nueva contraseña</Text>
          <TextInput
            style={styles.input}
            value={confirmarContrasena}
            onChangeText={setConfirmarContrasena}
            secureTextEntry
            placeholder="Confirme su nueva contraseña"
            autoCapitalize="none"
          />
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleCambiarContrasena}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Cambiar contraseña</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2d3436',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#636e72',
    marginBottom: 24,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2d3436',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#b2bec3',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  button: {
    backgroundColor: '#00b894',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: '#b2bec3',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoBox: {
    backgroundColor: '#fff3cd',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#ffc107',
  },
  infoText: {
    fontSize: 12,
    color: '#856404',
    lineHeight: 18,
  },
});
