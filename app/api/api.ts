import axios from 'axios';

const API_URL = 'http://192.168.1.26:7049/api';

export const api = axios.create({
  baseURL: API_URL,
});
