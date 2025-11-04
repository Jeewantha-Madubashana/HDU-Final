import axios from "axios";
import { store } from "../store/store";
import { clearCredentials } from "../features/auth/authSlice";

const BASE_URL = `${import.meta.env.VITE_API_URL}/api`;

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = store.getState().auth.token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      store.dispatch(clearCredentials());
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

export default apiClient;
