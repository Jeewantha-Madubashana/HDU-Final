import apiClient from "./apiClient";

/**
 * API functions for handling vital signs (critical factors)
 */

/**
 * Fetches the latest vital signs for a patient
 * @param {number} patientId - The patient's ID
 * @returns {Promise} - Promise with the latest vitals data
 */
export const fetchLatestVitalSigns = async (patientId) => {
  try {
    const response = await apiClient.get(
      `/critical-factors/patients/${patientId}/critical-factors`
    );
    return response.data;
  } catch (error) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "Failed to fetch vital signs";
    console.error("Error fetching vital signs:", errorMessage);
    throw new Error(errorMessage);
  }
};

/**
 * Creates a new vital signs record for a patient
 * @param {number} patientId - The patient's ID
 * @param {object} vitalSignsData - The vital signs data to save
 * @returns {Promise} - Promise with the created record
 */
export const createVitalSigns = async (patientId, vitalSignsData) => {
  try {
    const response = await apiClient.post(
      `/critical-factors/patients/${patientId}/critical-factors`,
      vitalSignsData
    );
    return response.data;
  } catch (error) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "Failed to create vital signs record";
    console.error("Error creating vital signs:", errorMessage);
    throw new Error(errorMessage);
  }
};

/**
 * Updates an existing vital signs record
 * @param {number} criticalFactorId - The ID of the record to update
 * @param {object} vitalSignsData - The updated vital signs data
 * @returns {Promise} - Promise with the updated record
 */
export const updateVitalSigns = async (criticalFactorId, vitalSignsData) => {
  try {
    const response = await apiClient.put(
      `/critical-factors/${criticalFactorId}`,
      vitalSignsData
    );
    return response.data;
  } catch (error) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "Failed to update vital signs record";
    console.error("Error updating vital signs:", errorMessage);
    throw new Error(errorMessage);
  }
};

/**
 * Fetches the audit history for a specific vital signs record
 * @param {number} criticalFactorId - The ID of the record to get history for
 * @returns {Promise} - Promise with the audit history
 */
export const getVitalSignsAuditHistory = async (criticalFactorId) => {
  try {
    const response = await apiClient.get(
      `/critical-factors/${criticalFactorId}/audit`
    );
    return response.data;
  } catch (error) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "Failed to fetch vital signs audit history";
    console.error("Error fetching audit history:", errorMessage);
    throw new Error(errorMessage);
  }
};

/**
 * Acknowledges an alert
 * @param {object} alertData - The alert data to acknowledge
 * @returns {Promise} - Promise with the acknowledgment response
 */
export const acknowledgeAlert = async (alertData) => {
  try {
    const response = await apiClient.post(
      `/critical-factors/acknowledge-alert`,
      alertData
    );
    return response.data;
  } catch (error) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "Failed to acknowledge alert";
    console.error("Error acknowledging alert:", errorMessage);
    throw new Error(errorMessage);
  }
};

/**
 * Fetches alert analytics data
 * @param {string} timeRange - Time range for analytics (default: '7' days)
 * @returns {Promise} - Promise with the analytics data
 */
export const getAlertAnalytics = async (timeRange = '7') => {
  try {
    const response = await apiClient.get(
      `/critical-factors/analytics/alerts?timeRange=${timeRange}`
    );
    return response.data;
  } catch (error) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "Failed to fetch alert analytics";
    console.error("Error fetching alert analytics:", errorMessage);
    throw new Error(errorMessage);
  }
};
