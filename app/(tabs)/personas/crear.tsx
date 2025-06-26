import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity
} from 'react-native';
import { api } from '../../api/api'; // ⚠️ Asegúrate de que esta ruta sea correcta

export default function CrearPersona() {
  const router = useRouter();

  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [cedula, setCedula] = useState('');
  const [residencia, setResidencia] = useState('');
  const [email, setEmail] = useState('');
  const [edad, setEdad] = useState('');
  const [celular, setCelular] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');

  const guardar = async () => {
    if (!nombre || !apellido || !cedula || !email) {
      Alert.alert('Campos requeridos', 'Nombre, Apellido, Cédula y Email son obligatorios.');
      return;
    }

    try {
      await api.post('/Persona/Crear', {
        nombre,
        apellido,
        cedula,
        residencia,
        email,
        edad: parseInt(edad),
        celular,
        fechaNacimiento, // Debe ir en formato 'YYYY-MM-DD'
      });

      Alert.alert('Éxito', 'Persona creada correctamente');
      router.back();
    } catch (error) {
      console.error('Error al crear persona:', error);
      Alert.alert('Error', 'No se pudo crear la persona');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Nueva Persona</Text>

      <TextInput placeholder="Nombre" value={nombre} onChangeText={setNombre} style={styles.input} />
      <TextInput placeholder="Apellido" value={apellido} onChangeText={setApellido} style={styles.input} />
      <TextInput placeholder="Cédula" value={cedula} onChangeText={setCedula} style={styles.input} />
      <TextInput placeholder="Residencia" value={residencia} onChangeText={setResidencia} style={styles.input} />
      <TextInput placeholder="Email" value={email} onChangeText={setEmail} style={styles.input} />
      <TextInput placeholder="Edad" keyboardType="numeric" value={edad} onChangeText={setEdad} style={styles.input} />
      <TextInput placeholder="Celular" value={celular} onChangeText={setCelular} style={styles.input} />
      <TextInput
        placeholder="Fecha de nacimiento (YYYY-MM-DD)"
        value={fechaNacimiento}
        onChangeText={setFechaNacimiento}
        style={styles.input}
      />

      <TouchableOpacity style={styles.button} onPress={guardar}>
        <Text style={styles.buttonText}>Guardar</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
    flexGrow: 1,
  },
  title: {
    fontSize: 22,
    marginBottom: 20,
    fontWeight: 'bold',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 10,
    marginBottom: 15,
  },
  button: {
    backgroundColor: '#00b894',
    padding: 15,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: { color: 'white', fontWeight: 'bold' },
});
