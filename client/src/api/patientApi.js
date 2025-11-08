import apiClient from "./apiClient";

/**
 * API functions for handling patient-related operations
 */

/**
 * Generate a unique patient ID
 * @returns {Promise} - Promise with the generated patient ID
 */
export const generateUniquePatientId = async () => {
  try {
    const response = await apiClient.get("/beds/generate-patient-id");
    return response.data;
  } catch (error) {
    const errorMessage =
      error.response?.data?.msg ||
      error.message ||
      "Failed to generate patient ID";
    console.error("Error generating patient ID:", errorMessage);
    throw new Error(errorMessage);
  }
};

/**
 * Check if patient ID is unique
 * @param {string} patientId - The patient ID to check
 * @returns {Promise} - Promise with uniqueness result
 */
export const checkPatientIdUniqueness = async (patientId) => {
  try {
    const response = await apiClient.get(`/patients/check-uniqueness/${patientId}`);
    return response.data;
  } catch (error) {
    const errorMessage =
      error.response?.data?.msg ||
      error.message ||
      "Failed to check patient ID uniqueness";
    console.error("Error checking patient ID uniqueness:", errorMessage);
    throw new Error(errorMessage);
  }
};

/**
 * Fetches patient analytics data
 * @returns {Promise} - Promise with the analytics data
 */
export const getPatientAnalytics = async () => {
  try {
    const response = await apiClient.get('/patients/analytics');
    return response.data;
  } catch (error) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "Failed to fetch patient analytics";
    console.error("Error fetching patient analytics:", errorMessage);
    throw new Error(errorMessage);
  }
};

/**
 * Fetches average length of stay analytics
 * @returns {Promise} - Promise with the ALOS data
 */
export const getAverageLengthOfStay = async () => {
  try {
    const response = await apiClient.get('/patients/analytics/length-of-stay');
    return response.data;
  } catch (error) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "Failed to fetch ALOS data";
    console.error("Error fetching ALOS:", errorMessage);
    throw new Error(errorMessage);
  }
};

/**
 * Fetches all patients
 * @returns {Promise} - Promise with the patients data
 */
export const getAllPatients = async () => {
  try {
    const response = await apiClient.get('/patients');
    return response.data;
  } catch (error) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "Failed to fetch patients";
    console.error("Error fetching patients:", errorMessage);
    throw new Error(errorMessage);
  }
};

/**
 * Fetches a specific patient by ID
 * @param {number} patientId - The patient's ID
 * @returns {Promise} - Promise with the patient data
 */
export const getPatientById = async (patientId) => {
  try {
    const response = await apiClient.get(`/patients/${patientId}`);
    return response.data;
  } catch (error) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "Failed to fetch patient";
    console.error("Error fetching patient:", errorMessage);
    throw new Error(errorMessage);
  }
};

/**
 * Discharges a patient
 * @param {number} patientId - The patient's ID
 * @param {object} dischargeData - The discharge data
 * @returns {Promise} - Promise with the discharge response
 */
export const dischargePatient = async (patientId, dischargeData) => {
  try {
    const response = await apiClient.post(`/patients/${patientId}/discharge`, dischargeData);
    return response.data;
  } catch (error) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "Failed to discharge patient";
    console.error("Error discharging patient:", errorMessage);
    throw new Error(errorMessage);
  }
};

/**
 * Updates incomplete patient data
 * Used to complete urgent admissions with full patient information
 * @param {number} patientId - The patient's ID
 * @param {object} patientData - Complete patient data
 * @returns {Promise} - Promise with the update response
 */
export const updateIncompletePatient = async (patientId, patientData) => {
  try {
    const response = await apiClient.put(`/patients/${patientId}/update-incomplete`, patientData);
    return response.data;
  } catch (error) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "Failed to update patient data";
    console.error("Error updating patient data:", errorMessage);
    throw new Error(errorMessage);
  }
};

/**
 * Fetches change history for a patient
 * @param {number} patientId - The patient's ID
 * @returns {Promise} - Promise with the change history data
 */
export const getPatientChangeHistory = async (patientId) => {
  try {
    const response = await apiClient.get(`/patients/${patientId}/change-history`);
    return response.data;
  } catch (error) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "Failed to fetch patient change history";
    console.error("Error fetching patient change history:", errorMessage);
    throw new Error(errorMessage);
  }
}; 