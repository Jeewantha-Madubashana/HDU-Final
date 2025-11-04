import { useDispatch, useSelector } from "react-redux";
import * as authApi from "../api/authApi";
import {
  setCredentials,
  clearCredentials,
  setLoading,
  setError,
  selectCurrentUser,
  selectCurrentToken,
} from "../features/auth/authSlice";

export const useAuth = () => {
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  const token = useSelector(selectCurrentToken);
  const loading = useSelector((state) => state.auth.loading);
  const error = useSelector((state) => state.auth.error);

  const login = async (credentials) => {
    try {
      dispatch(setLoading(true));
      const response = await authApi.login(credentials);
      dispatch(setCredentials(response));
      return response;
    } catch (err) {
      dispatch(setError(err.response?.data?.message || "Login failed"));
      throw err;
    } finally {
      dispatch(setLoading(false));
    }
  };

  const register = async (formData) => {
    try {
      dispatch(setLoading(true));
      const response = await authApi.register(formData);
      // Only set credentials if user is approved (has token)
      if (response.token) {
        dispatch(setCredentials(response));
      }
      return response;
    } catch (err) {
      dispatch(setError(err.response?.data?.msg || err.response?.data?.message || "Registration failed"));
      throw err;
    } finally {
      dispatch(setLoading(false));
    }
  };

  const logout = () => {
    dispatch(clearCredentials());
  };

  return {
    user,
    token,
    loading,
    error,
    login,
    register,
    logout,
  };
};
