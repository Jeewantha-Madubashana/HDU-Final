import apiClient from "./apiClient";

export const register = async (userData) => {
  const response = await apiClient.post("/auth/register", userData);
  return {
    user: response.data,
    token: response.data.token,
  };
};

export const login = async (userData) => {
  const response = await apiClient.post("/auth/login", userData);
  return {
    user: {
      id: response.data.id,
      role: response.data.role,
      username: userData.username,
    },
    token: response.data.token,
  };
};

export const getConsultants = async () => {
  const response = await apiClient.get("/auth/consultants");
  return response.data;
};
