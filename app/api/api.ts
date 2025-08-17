import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const API_URL = 'https://2a2e3a781967.ngrok-free.app/api';
//const API_URL = 'https://localhost:7049';

export const api = axios.create({
  baseURL: API_URL,
   headers: {
    'ngrok-skip-browser-warning': 'true',
  },
});

// Interceptor para agregar empresaId a cada request si existe
api.interceptors.request.use(async (config) => {
  const empresaId = await AsyncStorage.getItem('empresaId');

  if (empresaId) {
    config.headers['empresaId'] = empresaId; // puedes usar otro nombre si tu backend lo espera distinto
  }

  return config;
});