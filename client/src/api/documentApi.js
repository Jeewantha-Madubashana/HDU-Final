import apiClient from "./apiClient";

export const uploadPatientDocuments = async (patientId, formData) => {
  try {
    const response = await apiClient.post(
      `/documents/patients/${patientId}/documents`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  } catch (error) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "Failed to upload documents";
    console.error("Error uploading documents:", errorMessage);
    throw new Error(errorMessage);
  }
};

export const getPatientDocuments = async (patientId) => {
  try {
    const response = await apiClient.get(
      `/documents/patients/${patientId}/documents`
    );
    return response.data;
  } catch (error) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "Failed to retrieve patient documents";
    console.error("Error retrieving patient documents:", errorMessage);
    throw new Error(errorMessage);
  }
};

export const downloadPatientDocument = async (documentId) => {
  try {
    const response = await apiClient.get(
      `/documents/documents/${documentId}/download`,
      {
        responseType: 'blob', // Important for file downloads
      }
    );
    return response;
  } catch (error) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "Failed to download document";
    console.error("Error downloading document:", errorMessage);
    throw new Error(errorMessage);
  }
};

export const deletePatientDocument = async (documentId) => {
  try {
    const response = await apiClient.delete(
      `/documents/documents/${documentId}`
    );
    return response.data;
  } catch (error) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "Failed to delete document";
    console.error("Error deleting document:", errorMessage);
    throw new Error(errorMessage);
  }
};

export const updatePatientDocument = async (documentId, updateData) => {
  try {
    const response = await apiClient.put(
      `/documents/documents/${documentId}`,
      updateData
    );
    return response.data;
  } catch (error) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "Failed to update document";
    console.error("Error updating document:", errorMessage);
    throw new Error(errorMessage);
  }
};
