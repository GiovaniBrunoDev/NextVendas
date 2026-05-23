import axios from 'axios';

const api = axios.create({
  baseURL:
    process.env.REACT_APP_API_URL ||
    (process.env.NODE_ENV === "development"
      ? "http://localhost:3001"
      : "https://nextpdv.onrender.com"),
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("pdv_token");
  const lojaId = localStorage.getItem("pdv_loja_id");

  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (lojaId) config.headers["x-loja-id"] = lojaId;

  return config;
});

export default api;
