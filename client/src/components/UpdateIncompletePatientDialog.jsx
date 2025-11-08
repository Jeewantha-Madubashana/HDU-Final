import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Alert,
  CircularProgress,
  IconButton,
  Divider,
  Paper,
  Grid,
  Chip,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import {
  Close as CloseIcon,
  Person as PersonIcon,
  Contacts as ContactsIcon,
  Medication as MedicationIcon,
  Hotel as HotelIcon,
  History as HistoryIcon,
  Edit as EditIcon,
  ArrowBack as ArrowBackIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  CalendarToday as CalendarIcon,
  Assignment as AssignmentIcon,
  Badge,
  CreditCard,
  Cake,
  Wc,
  Favorite,
  Groups,
  Business,
  PersonPin,
  Warning,
  Bloodtype,
  PregnantWoman,
  MedicalServices,
  LocalHospital,
  ContactEmergency,
} from "@mui/icons-material";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { updateIncompletePatient, getPatientById } from "../api/patientApi";
import { getConsultants } from "../api/authApi";
import { uploadPatientDocuments } from "../api/documentApi";
import { useSelector, useDispatch } from "react-redux";
import { showToast } from "../features/ui/uiSlice";
import FormSection from "./NurseDashboardForms/PatientDialog/components/FormSection";
import DocumentUpload from "./NurseDashboardForms/PatientDialog/components/DocumentUpload";
import PatientChangeHistory from "./PatientChangeHistory";
import PatientDocumentsTab from "./PatientDocumentsTab";
import {
  patientDetailsFields,
  emergencyContactFields,
  medicalInfoFields,
  admissionFields,
} from "./NurseDashboardForms/PatientDialog/config/formFields";

/**
 * Dialog component for updating incomplete patient data
 * Used to complete urgent admissions with full patient information
 * Includes all sections: Patient Details, Emergency Contact, Medical Information, Admission Details, and Document Upload
 * Uses the same styling and components as the "Assign Patient to Bed" form for consistency
 * @param {boolean} open - Controls dialog visibility
 * @param {Function} onClose - Callback when dialog is closed
 * @param {number} patientId - ID of the incomplete patient
 * @param {Function} onUpdate - Callback after successful update to refresh parent data
 */
const UpdateIncompletePatientDialog = ({ open, onClose, patientId, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState(null);
  const [consultants, setConsultants] = useState([]);
  const [isLoadingConsultants, setIsLoadingConsultants] = useState(true);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [patientData, setPatientData] = useState(null);
  const dispatch = useDispatch();
  const token = useSelector((state) => state.auth.token);

  useEffect(() => {
    if (open) {
      setIsEditMode(false);
      setShowHistory(false);
      setError(null);
      setTabValue(0);
    }
  }, [open, patientId]);

  const [initialValues, setInitialValues] = useState({
    fullName: "",
    nicPassport: "",
    dateOfBirth: "",
    age: "",
    gender: "",
    maritalStatus: "Unknown",
    contactNumber: "",
    email: "",
    address: "",
    emergencyContactName: "",
    emergencyContactRelationship: "",
    emergencyContactNumber: "",
    knownAllergies: "",
    medicalHistory: "",
    currentMedications: "",
    pregnancyStatus: "Not Applicable",
    bloodType: "Unknown",
    initialDiagnosis: "",
    admissionDateTime: "",
    department: "HDU",
    consultantInCharge: "",
    medicalReports: null,
    idProof: null,
    consentForm: null,
    other: null,
  });

  const validationSchema = Yup.object({
    fullName: Yup.string().required("Full name is required"),
    nicPassport: Yup.string().nullable(),
    dateOfBirth: Yup.date().nullable(),
    age: Yup.number().nullable().min(0).max(150),
    gender: Yup.string().nullable().oneOf(["Male", "Female", "Other", null]),
    maritalStatus: Yup.string().nullable(),
    contactNumber: Yup.string().nullable(),
    email: Yup.string().email("Invalid email").nullable(),
    address: Yup.string().nullable(),
    emergencyContactName: Yup.string().nullable(),
    emergencyContactRelationship: Yup.string().nullable(),
    emergencyContactNumber: Yup.string().nullable(),
    knownAllergies: Yup.string().nullable(),
    medicalHistory: Yup.string().nullable(),
    currentMedications: Yup.string().nullable(),
    pregnancyStatus: Yup.string().nullable(),
    bloodType: Yup.string().nullable(),
    initialDiagnosis: Yup.string().nullable(),
    admissionDateTime: Yup.date().nullable(),
    department: Yup.string().nullable(),
    consultantInCharge: Yup.string().nullable(),
  });

  useEffect(() => {
    const fetchConsultants = async () => {
      try {
        setIsLoadingConsultants(true);
        const consultantsData = await getConsultants();
        setConsultants(consultantsData);
      } catch (error) {
        console.error("Failed to load consultants:", error);
      } finally {
        setIsLoadingConsultants(false);
      }
    };

    if (open) {
      fetchConsultants();
    }
  }, [open]);

  const fetchPatientData = async () => {
    if (open && patientId) {
      setFetching(true);
      setError(null);
      try {
        const patient = await getPatientById(patientId);
        
        if (patient) {
          setPatientData(patient);
          
          const emergencyContact = patient.emergencyContacts?.[0] || patient.EmergencyContacts?.[0];
          const medicalRecord = patient.medicalRecords?.[0] || patient.MedicalRecord;
          const admission = patient.admissions?.[0] || patient.Admissions?.[0];
          
          const admissionDateTime = admission?.admissionDateTime 
            ? new Date(admission.admissionDateTime).toISOString().slice(0, 16)
            : "";

          const initialData = {
            fullName: patient.fullName || "",
            nicPassport: patient.nicPassport || "",
            dateOfBirth: patient.dateOfBirth ? (patient.dateOfBirth.includes('T') ? patient.dateOfBirth.split('T')[0] : patient.dateOfBirth) : "",
            age: patient.age || "",
            gender: patient.gender || "",
            maritalStatus: patient.maritalStatus || "Unknown",
            contactNumber: patient.contactNumber || "",
            email: patient.email || "",
            address: patient.address || "",
            emergencyContactName: emergencyContact?.name || "",
            emergencyContactRelationship: emergencyContact?.relationship || "",
            emergencyContactNumber: emergencyContact?.contactNumber || "",
            knownAllergies: medicalRecord?.knownAllergies || "",
            medicalHistory: medicalRecord?.medicalHistory || "",
            currentMedications: medicalRecord?.currentMedications || "",
            pregnancyStatus: medicalRecord?.pregnancyStatus || "Not Applicable",
            bloodType: medicalRecord?.bloodType || "Unknown",
            initialDiagnosis: medicalRecord?.initialDiagnosis || "",
            admissionDateTime: admissionDateTime,
            department: admission?.department || "HDU",
            consultantInCharge: admission?.consultantInCharge || "",
            medicalReports: null,
            idProof: null,
            consentForm: null,
            other: null,
          };
          
          setInitialValues(initialData);
        }
      } catch (err) {
        console.error("Error fetching patient data:", err);
        setError(err.message || "Failed to fetch patient data");
      } finally {
        setFetching(false);
      }
    }
  };

  useEffect(() => {
    fetchPatientData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, patientId]);

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
      if (field.name === 'department') {
        return {
          ...field,
          options: ['HDU', 'ICU', 'Surgery', 'Medical']
        };
      }
      return field;
    });
  };

  const DetailItem = ({ label, value, icon, placeholder }) => {
    const labelLower = label.toLowerCase();
    
    // Treat "Unknown" as empty for specific fields
    const isEmptyValue = value === null || value === undefined || value === "" || 
                        String(value).trim() === "" ||
                        (labelLower.includes("marital") && String(value).trim().toLowerCase() === "unknown") ||
                        (labelLower.includes("gender") && String(value).trim().toLowerCase() === "unknown") ||
                        (labelLower.includes("blood") && String(value).trim().toLowerCase() === "unknown") ||
                        (labelLower.includes("pregnancy") && String(value).trim().toLowerCase() === "not applicable");
    
    const getPlaceholder = () => {
      // Check if value exists and is not empty/null/undefined/Unknown
      if (!isEmptyValue) {
        return value;
      }
      
      // Use custom placeholder if provided
      if (placeholder) return placeholder;
      
      // IDs and identification numbers
      if (labelLower.includes("patient id") || labelLower.includes("id") || 
          labelLower.includes("nic") || labelLower.includes("passport") || 
          (labelLower.includes("number") && !labelLower.includes("contact"))) {
        return "N/A";
      }
      
      // Names
      if (labelLower.includes("name") && !labelLower.includes("patient id")) {
        return "Not provided";
      }
      
      // Dates and times
      if (labelLower.includes("date") || labelLower.includes("time")) {
        return "Not provided";
      }
      
      // Age
      if (labelLower.includes("age")) {
        return "Not provided";
      }
      
      // Gender and status fields
      if (labelLower.includes("gender")) {
        return "Not specified";
      }
      if (labelLower.includes("marital")) {
        return "Not specified";
      }
      if (labelLower.includes("blood")) {
        return "Not specified";
      }
      
      // Contact information
      if (labelLower.includes("contact") || labelLower.includes("phone")) {
        return "Not provided";
      }
      if (labelLower.includes("email")) {
        return "Not provided";
      }
      if (labelLower.includes("address")) {
        return "Not provided";
      }
      
      // Relationship
      if (labelLower.includes("relationship")) {
        return "Not specified";
      }
      
      // Medical information - lists/descriptions
      if (labelLower.includes("allergies") || labelLower.includes("history") || 
          labelLower.includes("medications")) {
        return "None";
      }
      
      // Pregnancy status
      if (labelLower.includes("pregnancy")) {
        return "Not specified";
      }
      
      // Diagnosis
      if (labelLower.includes("diagnosis")) {
        return "Not provided";
      }
      
      // Department and consultant
      if (labelLower.includes("department")) {
        return "Not assigned";
      }
      if (labelLower.includes("consultant")) {
        return "Not assigned";
      }
      
      return "Not specified";
    };

    return (
      <Box 
        sx={{ 
          display: "grid",
          gridTemplateColumns: icon ? "24px 180px 1fr" : "180px 1fr",
          gap: 1.5,
          alignItems: "center",
          mb: 1.5,
          minHeight: "28px",
        }}
      >
        {icon && (
          <Box 
            sx={{ 
              color: "primary.main",
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-start",
              height: "100%",
            }}
          >
            {icon}
          </Box>
        )}
        <Typography 
          variant="body2" 
          sx={{ 
            fontWeight: "500",
            display: "flex",
            alignItems: "center",
            height: "100%",
            whiteSpace: "nowrap",
          }}
        >
          {label}:
        </Typography>
        <Typography 
          variant="body2" 
          color={isEmptyValue ? "text.disabled" : "text.secondary"}
          sx={{ 
            display: "flex",
            alignItems: "center",
            height: "100%",
            wordBreak: "break-word",
            fontStyle: isEmptyValue ? "italic" : "normal",
          }}
        >
          {getPlaceholder()}
        </Typography>
      </Box>
    );
  };

  const DetailSection = ({ title, icon, children }) => (
    <Paper sx={{ p: 3, mb: 3, bgcolor: "white" }}>
      <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
        {icon}
        <Typography variant="h6" sx={{ ml: 1, fontWeight: "bold" }}>
          {title}
        </Typography>
      </Box>
      {children}
    </Paper>
  );

  const handleEditClick = () => {
    setIsEditMode(true);
    setShowHistory(false);
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    fetchPatientData();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={showHistory ? "xl" : "lg"}
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
          maxHeight: "90vh",
        },
      }}
    >
      <Box
        sx={{
          bgcolor: isEditMode ? "warning.main" : "primary.main",
          color: "white",
          py: 2.5,
          px: 3,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "relative",
          zIndex: 1,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", flex: 1 }}>
          <PersonIcon sx={{ mr: 1, color: "white" }} />
          <Typography component="h1" variant="h6" fontWeight="bold">
            {isEditMode ? "Edit Patient Information" : "Patient Information"}
          </Typography>
          {isEditMode && (
            <Chip 
              label="Edit Mode" 
              size="small" 
              sx={{ ml: 2, bgcolor: "rgba(255,255,255,0.2)", color: "white" }} 
            />
          )}
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexShrink: 0 }}>
          <IconButton
            aria-label="close"
            onClick={onClose}
            sx={{ 
              color: "white", 
              ml: 1,
              "&:hover": { bgcolor: "rgba(255,255,255,0.1)" }
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </Box>

      <Box sx={{ p: showHistory ? 2 : 4, bgcolor: "#f5f8fa", maxHeight: "calc(90vh - 180px)", overflowY: "auto" }}>
        {fetching ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress />
          </Box>
        ) : showHistory ? (
          <Box sx={{ width: "100%" }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                Patient Change History
              </Typography>
              <Button
                startIcon={<ArrowBackIcon />}
                onClick={() => setShowHistory(false)}
                variant="outlined"
                sx={{ textTransform: "none" }}
              >
                Back to Patient Details
              </Button>
            </Box>
            <PatientChangeHistory patientId={patientId} />
          </Box>
        ) : isEditMode ? (
          <Formik
            initialValues={initialValues}
            enableReinitialize={true}
            validationSchema={validationSchema}
            onSubmit={async (values, { setSubmitting }) => {
              setSubmitting(true);
              setLoading(true);
              setError(null);
              setUploadStatus(null);

              try {
                const {
                  medicalReports,
                  idProof,
                  consentForm,
                  other,
                  ...patientData
                } = values;

                const fileData = {
                  medicalReports: medicalReports ? (Array.isArray(medicalReports) ? medicalReports : [medicalReports]) : [],
                  idProof: idProof ? (Array.isArray(idProof) ? idProof : [idProof]) : [],
                  consentForm: consentForm ? (Array.isArray(consentForm) ? consentForm : [consentForm]) : [],
                  other: other ? (Array.isArray(other) ? other : [other]) : [],
                };

                const normalizedData = {
                  fullName: patientData.fullName,
                  nicPassport: patientData.nicPassport || null,
                  dateOfBirth: patientData.dateOfBirth || null,
                  age: patientData.age ? parseInt(patientData.age) : null,
                  gender: patientData.gender || null,
                  maritalStatus: patientData.maritalStatus || "Unknown",
                  contactNumber: patientData.contactNumber || null,
                  email: patientData.email || null,
                  address: patientData.address || null,
                  emergencyContactName: patientData.emergencyContactName || null,
                  emergencyContactRelationship: patientData.emergencyContactRelationship || null,
                  emergencyContactNumber: patientData.emergencyContactNumber || null,
                  knownAllergies: patientData.knownAllergies || null,
                  medicalHistory: patientData.medicalHistory || null,
                  currentMedications: patientData.currentMedications || null,
                  pregnancyStatus: patientData.pregnancyStatus || "Not Applicable",
                  bloodType: patientData.bloodType || "Unknown",
                  initialDiagnosis: patientData.initialDiagnosis || null,
                  admissionDateTime: patientData.admissionDateTime ? new Date(patientData.admissionDateTime).toISOString() : null,
                  department: patientData.department || "HDU",
                  consultantInCharge: patientData.consultantInCharge || null,
                };

                await updateIncompletePatient(patientId, normalizedData);

                const hasDocuments = 
                  (fileData.medicalReports && fileData.medicalReports.length > 0) ||
                  (fileData.idProof && fileData.idProof.length > 0) ||
                  (fileData.consentForm && fileData.consentForm.length > 0) ||
                  (fileData.other && fileData.other.length > 0);

                if (hasDocuments) {
                  setUploadStatus("uploading");
                  try {
                    const formData = new FormData();
                    
                    if (fileData.medicalReports.length > 0) {
                      fileData.medicalReports.forEach((file) => {
                        formData.append('medicalReports', file);
                      });
                    }
                    
                    if (fileData.idProof.length > 0) {
                      fileData.idProof.forEach((file) => {
                        formData.append('idProof', file);
                      });
                    }
                    
                    if (fileData.consentForm.length > 0) {
                      fileData.consentForm.forEach((file) => {
                        formData.append('consentForm', file);
                      });
                    }
                    
                    if (fileData.other.length > 0) {
                      fileData.other.forEach((file) => {
                        formData.append('other', file);
                      });
                    }

                    await uploadPatientDocuments(patientId, formData);
                    setUploadStatus("success");
                  } catch (uploadError) {
                    setUploadStatus("error");
                    console.error("Document upload error:", uploadError);
                  }
                }

                dispatch(
                  showToast({
                    message: "Patient data updated successfully",
                    type: "success",
                  })
                );

                if (onUpdate) {
                  onUpdate();
                }

                setIsEditMode(false);
                await fetchPatientData();
              } catch (err) {
                setError(err.message || "Failed to update patient data");
                dispatch(
                  showToast({
                    message: err.message || "Failed to update patient data",
                    type: "error",
                  })
                );
              } finally {
                setSubmitting(false);
                setLoading(false);
              }
            }}
          >
            {(formikProps) => (
              <Form id="update-patient-form">
                {error && (
                  <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                  </Alert>
                )}

                {uploadStatus === "uploading" && (
                  <Alert severity="info" sx={{ mb: 3 }}>
                    Uploading patient documents...
                  </Alert>
                )}

                {uploadStatus === "success" && (
                  <Alert severity="success" sx={{ mb: 3 }}>
                    Documents uploaded successfully!
                  </Alert>
                )}

                {uploadStatus === "error" && (
                  <Alert severity="warning" sx={{ mb: 3 }}>
                    Patient data was updated, but there was an issue uploading documents. You can upload documents later.
                  </Alert>
                )}

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
                  fields={patientDetailsFields.filter(field => field.name !== 'patientNumber')}
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
                  fields={[
                    ...medicalInfoFields,
                    {
                      name: "initialDiagnosis",
                      label: "Initial Diagnosis",
                      type: "text",
                      multiline: true,
                      rows: 7,
                      gridProps: { xs: 12 },
                    }
                  ]}
                  formProps={formikProps}
                />

                <FormSection
                  icon={<HotelIcon color="primary" fontSize="large" />}
                  title="Admission Details"
                  fields={getAdmissionFieldsWithConsultants().filter(field => field.name !== 'bedNumber' && field.name !== 'initialDiagnosis')}
                  formProps={formikProps}
                />

                <DocumentUpload
                  formProps={formikProps}
                  uploadStatus={uploadStatus}
                  patientId={patientId}
                  onUpdate={async () => {
                    await fetchPatientData();
                    if (onUpdate) {
                      onUpdate();
                    }
                  }}
                />

                <Box sx={{ mt: 3, textAlign: "right" }}>
                  <Typography variant="caption" color="text.secondary">
                    * Required fields
                  </Typography>
                </Box>
              </Form>
            )}
          </Formik>
        ) : (
          <Box>
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}
            
            {!patientData && !fetching && (
              <Alert severity="info" sx={{ mb: 3 }}>
                No patient data available
              </Alert>
            )}
            
            {patientData && !isEditMode && !showHistory && (
              <>
                <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 3, gap: 2 }}>
                  <Button
                    startIcon={<HistoryIcon />}
                    onClick={() => setShowHistory(true)}
                    variant="outlined"
                    sx={{ textTransform: "none" }}
                  >
                    History
                  </Button>
                  <Button
                    startIcon={<EditIcon />}
                    onClick={handleEditClick}
                    variant="contained"
                    color="primary"
                    sx={{ 
                      textTransform: "none",
                      fontWeight: "bold",
                    }}
                  >
                    Edit Patient Data
                  </Button>
                </Box>
                <Tabs
                  value={tabValue}
                  onChange={(e, newValue) => setTabValue(newValue)}
                  sx={{ mb: 3 }}
                >
                  <Tab label="Patient Information" />
                  <Tab label="Documents" />
                </Tabs>

                {/* Patient Information Tab */}
                {tabValue === 0 && (
                  <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <DetailSection
                    title="Patient Details"
                    icon={<PersonIcon sx={{ color: "primary.main", fontSize: "28px" }} />}
                  >
                    <DetailItem label="Full Name" value={patientData.fullName} icon={<PersonIcon sx={{ fontSize: "16px" }} />} />
                    <DetailItem label="Patient ID" value={patientData.patientNumber} icon={<Badge sx={{ fontSize: "16px" }} />} />
                    <DetailItem label="NIC/Passport" value={patientData.nicPassport} icon={<CreditCard sx={{ fontSize: "16px" }} />} />
                    <DetailItem 
                      label="Date of Birth" 
                      value={patientData.dateOfBirth ? new Date(patientData.dateOfBirth).toLocaleDateString() : null}
                      icon={<CalendarIcon sx={{ fontSize: "16px" }} />}
                    />
                    <DetailItem label="Age" value={patientData.age} icon={<Cake sx={{ fontSize: "16px" }} />} />
                    <DetailItem label="Gender" value={patientData.gender} icon={<Wc sx={{ fontSize: "16px" }} />} />
                    <DetailItem label="Marital Status" value={patientData.maritalStatus} icon={<Favorite sx={{ fontSize: "16px" }} />} />
                    <DetailItem label="Contact Number" value={patientData.contactNumber} icon={<PhoneIcon sx={{ fontSize: "16px" }} />} />
                    <DetailItem label="Email" value={patientData.email} icon={<EmailIcon sx={{ fontSize: "16px" }} />} />
                    <DetailItem label="Address" value={patientData.address} icon={<LocationIcon sx={{ fontSize: "16px" }} />} />
                  </DetailSection>
                </Grid>

                <Grid item xs={12} md={6}>
                  <DetailSection
                    title="Emergency Contact Information"
                    icon={<ContactsIcon sx={{ color: "primary.main", fontSize: "28px" }} />}
                  >
                    <DetailItem 
                      label="Name" 
                      value={patientData.emergencyContacts?.[0]?.name || patientData.EmergencyContacts?.[0]?.name}
                      icon={<PersonIcon sx={{ fontSize: "16px" }} />}
                    />
                    <DetailItem 
                      label="Relationship" 
                      value={patientData.emergencyContacts?.[0]?.relationship || patientData.EmergencyContacts?.[0]?.relationship}
                      icon={<Groups sx={{ fontSize: "16px" }} />}
                    />
                    <DetailItem 
                      label="Contact Number" 
                      value={patientData.emergencyContacts?.[0]?.contactNumber || patientData.EmergencyContacts?.[0]?.contactNumber}
                      icon={<PhoneIcon sx={{ fontSize: "16px" }} />}
                    />
                  </DetailSection>

                  <DetailSection
                    title="Medical Information"
                    icon={<MedicationIcon sx={{ color: "primary.main", fontSize: "28px" }} />}
                  >
                    <DetailItem 
                      label="Known Allergies" 
                      value={patientData.medicalRecords?.[0]?.knownAllergies || patientData.MedicalRecord?.knownAllergies}
                      icon={<Warning sx={{ fontSize: "16px" }} />}
                    />
                    <DetailItem 
                      label="Medical History" 
                      value={patientData.medicalRecords?.[0]?.medicalHistory || patientData.MedicalRecord?.medicalHistory}
                      icon={<HistoryIcon sx={{ fontSize: "16px" }} />}
                    />
                    <DetailItem 
                      label="Current Medications" 
                      value={patientData.medicalRecords?.[0]?.currentMedications || patientData.MedicalRecord?.currentMedications}
                      icon={<MedicationIcon sx={{ fontSize: "16px" }} />}
                    />
                    <DetailItem 
                      label="Pregnancy Status" 
                      value={patientData.medicalRecords?.[0]?.pregnancyStatus || patientData.MedicalRecord?.pregnancyStatus}
                      icon={<PregnantWoman sx={{ fontSize: "16px" }} />}
                    />
                    <DetailItem 
                      label="Blood Type" 
                      value={patientData.medicalRecords?.[0]?.bloodType || patientData.MedicalRecord?.bloodType}
                      icon={<Bloodtype sx={{ fontSize: "16px" }} />}
                    />
                    <DetailItem 
                      label="Initial Diagnosis" 
                      value={patientData.medicalRecords?.[0]?.initialDiagnosis || patientData.MedicalRecord?.initialDiagnosis}
                      icon={<LocalHospital sx={{ fontSize: "16px" }} />}
                    />
                  </DetailSection>

                  <DetailSection
                    title="Admission Details"
                    icon={<HotelIcon sx={{ color: "primary.main", fontSize: "28px" }} />}
                  >
                    <DetailItem 
                      label="Admission Date & Time" 
                      value={patientData.admissions?.[0]?.admissionDateTime 
                        ? new Date(patientData.admissions[0].admissionDateTime).toLocaleString()
                        : (patientData.Admissions?.[0]?.admissionDateTime 
                          ? new Date(patientData.Admissions[0].admissionDateTime).toLocaleString()
                          : null)}
                      icon={<CalendarIcon sx={{ fontSize: "16px" }} />}
                    />
                    <DetailItem 
                      label="Department" 
                      value={patientData.admissions?.[0]?.department || patientData.Admissions?.[0]?.department}
                      icon={<Business sx={{ fontSize: "16px" }} />}
                    />
                    <DetailItem 
                      label="Consultant In Charge" 
                      value={patientData.admissions?.[0]?.consultantInCharge || patientData.Admissions?.[0]?.consultantInCharge}
                      icon={<PersonPin sx={{ fontSize: "16px" }} />}
                    />
                  </DetailSection>
                </Grid>
              </Grid>
                )}

                {/* Documents Tab */}
                {!isEditMode && !showHistory && tabValue === 1 && (
                  <Box>
                    <PatientDocumentsTab
                      patientId={patientId}
                      onUpdate={async () => {
                        await fetchPatientData();
                        if (onUpdate) {
                          onUpdate();
                        }
                      }}
                    />
                  </Box>
                )}
              </>
            )}
          </Box>
        )}
      </Box>

      <DialogActions sx={{ p: 2, bgcolor: "#f5f8fa", borderTop: "1px solid #e0e0e0", justifyContent: "flex-end", minHeight: "64px" }}>
        {isEditMode ? (
          <>
            <Button
              onClick={handleCancelEdit}
              variant="outlined"
              color="secondary"
              disabled={loading}
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
              form="update-patient-form"
              variant="contained"
              color="primary"
              disabled={loading || fetching || !patientId}
              sx={{
                borderRadius: 2,
                px: 4,
                py: 1.2,
                fontWeight: "medium",
                textTransform: "none",
                minWidth: "180px",
              }}
              startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
            >
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </>
        ) : (
          <Button
            onClick={onClose}
            variant="outlined"
            color="secondary"
            sx={{
              borderRadius: 2,
              px: 3.5,
              py: 1.2,
              textTransform: "none",
            }}
          >
            Close
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default UpdateIncompletePatientDialog;
