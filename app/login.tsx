import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../context/authContext';

export default function Login() {
  const { login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = () => {
    // Por ahora permite cualquier credencial
    login();
    router.replace('/(tabs)/home'); // o la ruta real de tu vista principal
  };

  return (
    <View style={styles.container}>
    <View style={styles.logoContainer}>
      <Image
        source={require('../assets/images/logo1.png')}
        style={styles.logo}
      />
    </View>
      <TextInput
        style={styles.input}
        placeholder="Usuario"
        value={email}
        onChangeText={setEmail}
        placeholderTextColor="#555"
      />
      
      <View style={styles.passwordContainer}>
        <TextInput
          style={styles.passwordInput}
          placeholder="Contraseña"
          value={password}
          secureTextEntry={!showPassword}
          onChangeText={setPassword}
          placeholderTextColor="#555"
        />

        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
          <Ionicons
            name={showPassword ? 'eye-off-outline' : 'eye-outline'}
            size={24}
            color="#555"
          />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.button, !(email && password) && styles.buttonDisabled]}
        onPress={handleLogin}
        disabled={!(email && password)}>
        <Text style={styles.buttonText}>Ingresar</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => alert('Recuperación no implementada')}>
        <Text style={styles.forgotPassword}>¿Olvidó su contraseña?</Text>
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#A8E6CF', // fondo verde menta
  },
  title: {
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    marginBottom: 10,
    padding: 10,
    borderRadius: 5,
    backgroundColor: '#fff',
  },
  button: {
    backgroundColor: '#4CAF50', // verde más oscuro
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  buttonDisabled: {
    backgroundColor: '#A5D6A7', // un verde más claro para indicar deshabilitado
  },
toggle: {
  marginLeft: 10,
  fontSize: 18,
},
forgotPassword: {
  marginTop: 15,
  textAlign: 'center',
  color: '#555',
  textDecorationLine: 'underline',
},
passwordContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  borderWidth: 1,
  borderColor: '#ccc',
  borderRadius: 5,
  backgroundColor: '#fff',
  marginBottom: 10,
  paddingHorizontal: 10,
},
passwordInput: {
  flex: 1,
  paddingVertical: 10,
},
logo: {
  width: 200,
  height: 200,
  resizeMode: 'contain',
  marginBottom: 20,
  textAlign: "center"
},
logoContainer: {
  alignItems: 'center',
  justifyContent: 'center',
  width: '100%',
  marginBottom: 20 // para separarlo del formulario
}
});
