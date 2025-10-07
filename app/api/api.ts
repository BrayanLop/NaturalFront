import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const API_URL = 'http://natural-gestion.duckdns.org/api';
//const API_URL = 'https://localhost:7049';

export const api = axios.create({
  baseURL: API_URL,
   headers: {
    'ngrok-skip-browser-warning': 'true',
  },
});

api.interceptors.request.use(async (config) => {
  const empresaId = await AsyncStorage.getItem('empresaId');

  if (empresaId) {
    config.headers['empresaId'] = empresaId;
  }

  return config;
});