import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'https://nextpdv.onrender.com',
});

export default api;
