import apiClient from "./apiClient";

/**
 * API functions for handling vital signs configuration
 */

/**
 * Fetches all vital signs configurations (including inactive)
 * @returns {Promise} - Promise with all vital signs configurations
 */
export const getAllVitalSignsConfig = async () => {
  try {
    const response = await apiClient.get("/vital-signs-config/all");
    return response.data;
  } catch (error) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "Failed to fetch vital signs configurations";
    console.error("Error fetching vital signs config:", errorMessage);
    throw new Error(errorMessage);
  }
};

/**
 * Fetches active vital signs configurations only
 * @returns {Promise} - Promise with active vital signs configurations
 */
export const getActiveVitalSignsConfig = async () => {
  try {
    const response = await apiClient.get("/vital-signs-config/active");
    return response.data;
  } catch (error) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "Failed to fetch active vital signs configurations";
    console.error("Error fetching active vital signs config:", errorMessage);
    throw new Error(errorMessage);
  }
};

/**
 * Fetches a single vital signs configuration by ID
 * @param {number} id - The configuration ID
 * @returns {Promise} - Promise with the vital signs configuration
 */
export const getVitalSignsConfigById = async (id) => {
  try {
    const response = await apiClient.get(`/vital-signs-config/${id}`);
    return response.data;
  } catch (error) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "Failed to fetch vital signs configuration";
    console.error("Error fetching vital signs config:", errorMessage);
    throw new Error(errorMessage);
  }
};

/**
 * Creates a new vital signs configuration
 * @param {object} configData - The vital signs configuration data
 * @returns {Promise} - Promise with the created configuration
 */
export const createVitalSignsConfig = async (configData) => {
  try {
    const response = await apiClient.post("/vital-signs-config", configData);
    return response.data;
  } catch (error) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "Failed to create vital signs configuration";
    console.error("Error creating vital signs config:", errorMessage);
    throw new Error(errorMessage);
  }
};

/**
 * Updates an existing vital signs configuration
 * @param {number} id - The configuration ID
 * @param {object} configData - The updated vital signs configuration data
 * @returns {Promise} - Promise with the updated configuration
 */
export const updateVitalSignsConfig = async (id, configData) => {
  try {
    const response = await apiClient.put(`/vital-signs-config/${id}`, configData);
    return response.data;
  } catch (error) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "Failed to update vital signs configuration";
    console.error("Error updating vital signs config:", errorMessage);
    throw new Error(errorMessage);
  }
};

/**
 * Deletes a vital signs configuration
 * @param {number} id - The configuration ID
 * @returns {Promise} - Promise with the deletion response
 */
export const deleteVitalSignsConfig = async (id) => {
  try {
    const response = await apiClient.delete(`/vital-signs-config/${id}`);
    return response.data;
  } catch (error) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "Failed to delete vital signs configuration";
    console.error("Error deleting vital signs config:", errorMessage);
    throw new Error(errorMessage);
  }
};

/**
 * Toggles the active status of a vital signs configuration
 * @param {number} id - The configuration ID
 * @returns {Promise} - Promise with the updated configuration
 */
export const toggleVitalSignsConfigStatus = async (id) => {
  try {
    const response = await apiClient.patch(`/vital-signs-config/${id}/toggle-status`);
    return response.data;
  } catch (error) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "Failed to toggle vital signs configuration status";
    console.error("Error toggling vital signs config status:", errorMessage);
    throw new Error(errorMessage);
  }
};

