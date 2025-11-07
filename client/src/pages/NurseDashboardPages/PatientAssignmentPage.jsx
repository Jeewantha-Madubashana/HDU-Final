import React, { useState, useEffect } from "react";
import {
  Button,
  Typography,
  Box,
  IconButton,
  Alert,
  Paper,
  Container,
  Divider,
} from "@mui/material";
import { Formik, Form } from "formik";
import {
  Close as CloseIcon,
  Person as PersonIcon,
  Contacts as ContactsIcon,
  Medication as MedicationIcon,
  Hotel as HotelIcon,
} from "@mui/icons-material";
import { useDispatch, useSelector } from "react-redux";
import {
  updateFormData,
  resetForm,
} from "../../features/patients/patientSlice";
import { setLoading } from "../../features/loaderSlice";
import { uploadPatientDocuments } from "../../api/documentApi";
import { generateUniquePatientId } from "../../api/patientApi";
import { getConsultants } from "../../api/authApi";

import FormSection from "../../components/NurseDashboardForms/PatientDialog/components/FormSection";
import DocumentUpload from "../../components/NurseDashboardForms/PatientDialog/components/DocumentUpload";
import {
  patientDetailsFields,
  emergencyContactFields,
  medicalInfoFields,
  admissionFields,
} from "../../components/NurseDashboardForms/PatientDialog/config/formFields";
import { validationSchema } from "../../components/NurseDashboardForms/PatientDialog/validationSchema";

const PatientAssignmentPage = ({ handleSubmit, onClose }) => {
  const dispatch = useDispatch();
  const { selectedBed, formData } = useSelector((state) => state.patient);
  const [submissionError, setSubmissionError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [generatedPatientId, setGeneratedPatientId] = useState("");
  const [isGeneratingId, setIsGeneratingId] = useState(true);
  const [consultants, setConsultants] = useState([]);
  const [isLoadingConsultants, setIsLoadingConsultants] = useState(true);
  const handleCancel = () => {
    dispatch(resetForm());
    dispatch(setLoading(false));
    if (onClose) onClose();
  };

  // Generate unique patient ID when component mounts
  useEffect(() => {
    const fetchPatientId = async () => {
      try {
        setIsGeneratingId(true);
        const response = await generateUniquePatientId();
        setGeneratedPatientId(response.patientId);
      } catch (error) {
        console.error("Failed to generate patient ID:", error);
        setSubmissionError("Failed to generate patient ID. Please try again.");
      } finally {
        setIsGeneratingId(false);
      }
    };

    fetchPatientId();
  }, []);

  // Load consultants when component mounts
  useEffect(() => {
    const fetchConsultants = async () => {
      try {
        setIsLoadingConsultants(true);
        const consultantsData = await getConsultants();
        setConsultants(consultantsData);
      } catch (error) {
        console.error("Failed to load consultants:", error);
        setSubmissionError("Failed to load consultants. Please refresh the page.");
      } finally {
        setIsLoadingConsultants(false);
      }
    };

    fetchConsultants();
  }, []);

  // Create admission fields with populated consultant options
  const getAdmissionFieldsWithConsultants = () => {
    return admissionFields.map(field => {
      if (field.isConsultantField) {
        const consultantOptions = consultants.map(consultant => {
          const displayName = consultant.nameWithInitials || 'Unknown';
          const specialty = consultant.speciality ? ` (${consultant.speciality})` : '';
          return `${displayName}${specialty}`;
        });
        
        return {
          ...field,
          options: isLoadingConsultants ? ['Loading consultants...'] : consultantOptions,
          disabled: isLoadingConsultants
        };
      }
      return field;
    });
  };

  const initialValues = {
    ...formData,
    patientNumber: isGeneratingId ? "Generating..." : (generatedPatientId || formData.patientNumber || ""),
    bedNumber: selectedBed?.bedNumber || "",
  };

  const normalizeFormData = (values) => {
    const normalizedData = {
      ...values,
      bedId: selectedBed?.id,
    };

    if (normalizedData.dateOfBirth) {
      try {
        normalizedData.dateOfBirth = new Date(normalizedData.dateOfBirth)
          .toISOString()
          .split("T")[0];
      } catch (e) {
        console.error("Error formatting date of birth:", e);
      }
    }

    if (normalizedData.admissionDateTime) {
      try {
        normalizedData.admissionDateTime = new Date(
          normalizedData.admissionDateTime
        ).toISOString();
      } catch (e) {
        console.error("Error formatting admission date time:", e);
      }
    }

    return normalizedData;
  };

  const hasDocuments = (fileData) => {
    return (
      (fileData.medicalReports && fileData.medicalReports.length > 0) ||
      (fileData.idProof && (Array.isArray(fileData.idProof) ? fileData.idProof.length > 0 : true)) ||
      (fileData.consentForm && (Array.isArray(fileData.consentForm) ? fileData.consentForm.length > 0 : true)) ||
      (fileData.other && fileData.other.length > 0)
    );
  };
  const processDocumentUploads = async (patientId, fileData) => {
    if (!hasDocuments(fileData)) {
      return;
    }
    setUploadStatus("uploading");
    dispatch(setLoading(true));
    try {
      const formData = new FormData();
      let hasFiles = false;

      // Add medical reports
      if (fileData.medicalReports && fileData.medicalReports.length > 0) {
        fileData.medicalReports.forEach((file) => {
          formData.append('medicalReports', file);
          hasFiles = true;
        });
      }

      // Add ID proof
      if (fileData.idProof) {
        if (Array.isArray(fileData.idProof)) {
          fileData.idProof.forEach((file) => {
            formData.append('idProof', file);
            hasFiles = true;
          });
        } else {
          formData.append('idProof', fileData.idProof);
          hasFiles = true;
        }
      }

      // Add consent form
      if (fileData.consentForm) {
        if (Array.isArray(fileData.consentForm)) {
          fileData.consentForm.forEach((file) => {
            formData.append('consentForm', file);
            hasFiles = true;
          });
        } else {
          formData.append('consentForm', fileData.consentForm);
          hasFiles = true;
        }
      }

      // Add other documents
      if (fileData.other && fileData.other.length > 0) {
        fileData.other.forEach((file) => {
          formData.append('other', file);
          hasFiles = true;
        });
      }

      if (!hasFiles) {
        setUploadStatus("success");
        dispatch(setLoading(false));
        return;
      }

      await uploadPatientDocuments(
        patientId,
        formData
      );
      setUploadStatus("success");
    } catch (error) {
      console.error("Document upload error:", error);
      setUploadStatus("error");
    } finally {
      dispatch(setLoading(false));
    }
  };

  return (
    <Container maxWidth="lg">
      <Paper sx={{ borderRadius: 2, overflow: "hidden", mb: 4 }}>
        <Box
          sx={{
            bgcolor: "primary.main",
            color: "white",
            py: 2.5,
            px: 3,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Typography component="h1" variant="h6" fontWeight="bold">
            Assign Patient to {selectedBed?.bedNumber}
          </Typography>
          <IconButton
            aria-label="close"
            onClick={handleCancel}
            sx={{ color: "white" }}
          >
            <CloseIcon />
          </IconButton>
        </Box>

        <Box sx={{ p: 4, bgcolor: "#f5f8fa" }}>
          {submissionError && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {submissionError}
            </Alert>
          )}

          {successMessage && (
            <Alert severity="success" sx={{ mb: 3 }}>
              {successMessage}
            </Alert>
          )}

          {uploadStatus === "error" && (
            <Alert severity="warning" sx={{ mb: 3 }}>
              Patient was created successfully, but there was an issue uploading
              documents. You can upload documents later from the patient details
              page.
            </Alert>
          )}

          <Formik
            initialValues={initialValues}
            enableReinitialize={true}
            validationSchema={validationSchema}
            onSubmit={async (values, { setSubmitting, resetForm }) => {
              setSubmitting(true);
              setSubmissionError(null);
              dispatch(setLoading(true));
              try {
                const {
                  medicalReports,
                  idProof,
                  consentForm,
                  other,
                  ...serializableValues
                } = values;

                const fileData = {
                  medicalReports,
                  idProof,
                  consentForm,
                  other,
                };

                dispatch(updateFormData(serializableValues));

                const normalizedData = normalizeFormData(values);
                const patientResponse = await handleSubmit(normalizedData);

                if (
                  patientResponse &&
                  patientResponse.patientId &&
                  hasDocuments(fileData)
                ) {
                  await processDocumentUploads(
                    patientResponse.patientId,
                    fileData
                  );
                } else if (!patientResponse?.patientId) {
                  console.error(
                    "Missing patient ID in response:",
                    patientResponse
                  );
                }

                // Clear form data after successful submission
                resetForm();
                dispatch(updateFormData({})); // Clear Redux form data
                setGeneratedPatientId(null); // Clear generated patient ID
                setSubmissionError(null); // Clear any previous errors
                setUploadStatus(null); // Clear upload status
                
                // Show success message
                setSuccessMessage("✅ Patient assigned successfully! Form has been cleared for next patient.");
                
                // Generate new patient ID for next assignment
                fetchPatientId();
                
                // Clear success message after 5 seconds
                setTimeout(() => {
                  setSuccessMessage(null);
                }, 5000);
              } catch (error) {
                console.error(
                  "[PatientAssignmentPage] Form submission error:",
                  error
                );
                setSubmissionError(
                  "An error occurred while submitting the form. Please try again."
                );
              } finally {
                setSubmitting(false);
                dispatch(setLoading(false));
              }
            }}
          >
            {(formikProps) => {
              return (
                <Form>
                  <Typography
                    variant="h6"
                    color="primary"
                    sx={{ mb: 3, fontWeight: "bold" }}
                  >
                    Patient Information Form
                  </Typography>
                  <Divider sx={{ mb: 4 }} />
                  <FormSection
                    icon={<PersonIcon color="primary" fontSize="large" />}
                    title="Patient Details"
                    fields={patientDetailsFields}
                    formProps={formikProps}
                  />
                  <FormSection
                    icon={<ContactsIcon color="primary" fontSize="large" />}
                    title="Emergency Contact Information"
                    fields={emergencyContactFields}
                    formProps={formikProps}
                  />
                  <FormSection
                    icon={<MedicationIcon color="primary" fontSize="large" />}
                    title="Medical Information"
                    fields={medicalInfoFields}
                    formProps={formikProps}
                  />{" "}
                  <FormSection
                    icon={<HotelIcon color="primary" fontSize="large" />}
                    title="Admission Details"
                    fields={getAdmissionFieldsWithConsultants()}
                    formProps={formikProps}
                  />
                  <DocumentUpload
                    formProps={formikProps}
                    uploadStatus={uploadStatus}
                  />
                  <Box sx={{ mt: 3, textAlign: "right" }}>
                    <Typography variant="caption" color="text.secondary">
                      * Required fields
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      mt: 4,
                      px: 1,
                      pb: 3,
                      display: "flex",
                      justifyContent: "flex-end",
                    }}
                  >
                    <Button
                      onClick={handleCancel}
                      variant="outlined"
                      color="secondary"
                      sx={{
                        borderRadius: 2,
                        px: 3.5,
                        py: 1.2,
                        mr: 2,
                        textTransform: "none",
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      sx={{
                        borderRadius: 2,
                        px: 4,
                        py: 1.2,
                        fontWeight: "medium",
                        textTransform: "none",
                      }}
                      disabled={formikProps.isSubmitting}
                    >
                      Assign Patient
                    </Button>
                  </Box>
                </Form>
              );
            }}
          </Formik>
        </Box>
      </Paper>
    </Container>
  );
};

export default PatientAssignmentPage;
