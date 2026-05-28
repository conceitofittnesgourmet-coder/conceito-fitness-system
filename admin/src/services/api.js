import axios from "axios";

const api = axios.create({
  baseURL: "https://conceito-fitness-system.onrender.com/api",
});

// TOKEN AUTOMÁTICO
api.interceptors.request.use((config) => {

  const token = localStorage.getItem("token");

  // só envia se existir
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;