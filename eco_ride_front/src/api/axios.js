import axios from "axios";

const instance = axios.create({
  baseURL: "http://localhost:3000/api", // ton futur backend Node
  timeout: 5000,
});

// Ajouter le token automatiquement si présent
instance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token"); // on fera mieux après
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default instance;

