import apiClient from "./apiClient";

export const register = async (userData) => {
  const response = await apiClient.post("/auth/register", userData);
  return response.data;
};

export const login = async (userData) => {
  const response = await apiClient.post("/auth/login", userData);
  return {
    user: {
      id: response.data.id,
      role: response.data.role,
      username: response.data.user?.username || userData.username,
    },
    token: response.data.token,
  };
};

export const getConsultants = async () => {
  const response = await apiClient.get("/auth/consultants");
  return response.data;
};

// Super Admin endpoints
export const getPendingUsers = async () => {
  const response = await apiClient.get("/auth/pending-users");
  return response.data;
};

export const getAllUsers = async () => {
  const response = await apiClient.get("/auth/all-users");
  return response.data;
};

export const approveUser = async (userId) => {
  const response = await apiClient.put(`/auth/approve/${userId}`);
  return response.data;
};

export const rejectUser = async (userId) => {
  const response = await apiClient.put(`/auth/reject/${userId}`);
  return response.data;
};
