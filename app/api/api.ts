import axios from 'axios';

const API_URL = 'https://d4cd-181-128-27-245.ngrok-free.app/api';
//const API_URL = 'https://localhost:7049';

export const api = axios.create({
  baseURL: API_URL,
   headers: {
    'ngrok-skip-browser-warning': 'true',
  },
});
