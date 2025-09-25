import axios from 'axios';

const api = axios.create({
  baseURL: 'https://nextpdv.onrender.com', // URL do seu backend
});

export default api;
