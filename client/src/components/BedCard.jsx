import React, { useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Chip,
  Tooltip,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Divider,
  IconButton,
  CircularProgress,
} from "@mui/material";
import {
  Hotel,
  Remove as RemoveIcon,
  Assignment as AssignmentIcon,
  Person,
  Phone,
  CalendarToday,
  LocationOn,
  Wc,
  Close as CloseIcon,
  Email,
  Emergency,
  MedicalServices,
  History,
  Medication,
  Bloodtype,
  PregnantWoman,
  Warning,
  ContactEmergency,
  Info,
} from "@mui/icons-material";
import { styled } from "@mui/material/styles";
import DischargeDialog from "./DischargeDialog";
import CriticalFactorsForm from "./CriticalFactorsForm";
import PatientDocumentsViewer from "./PatientDocumentsViewer";
import { fetchLatestVitalSigns } from "../api/vitalSignsApi";

const StyledCard = styled(Card)(({ theme, occupied }) => ({
  minHeight: "300px",
  height: "auto",
  display: "flex",
  flexDirection: "column",
  position: "relative",
  transition: "all 0.3s ease",
  border: occupied ? "2px solid #e74c3c" : "2px solid #27ae60",
  cursor: occupied ? "pointer" : "default",
  "&:hover": {
    transform: "translateY(-4px)",
    boxShadow: theme.shadows[8],
  },
}));

const DetailSection = ({ title, icon, children }) => (
  <Box sx={{ mb: 3 }}>
    <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
      {icon}
      <Typography variant="h6" sx={{ ml: 1, fontWeight: "bold" }}>
        {title}
      </Typography>
    </Box>
    {children}
  </Box>
);

const DetailItem = ({ label, value, icon }) => (
  <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
    {icon && <Box sx={{ mr: 1, color: "primary.main" }}>{icon}</Box>}
    <Typography variant="body2" sx={{ fontWeight: "500", minWidth: "120px" }}>
      {label}:
    </Typography>
    <Typography variant="body2" color="text.secondary">
      {value || "Not specified"}
    </Typography>
  </Box>
);

const BedCard = ({ bed, assignBed, deassignBed }) => {
  const [dischargeDialogOpen, setDischargeDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [vitalsFormOpen, setVitalsFormOpen] = useState(false);
  const [documentsDialogOpen, setDocumentsDialogOpen] = useState(false);
  const [latestVitals, setLatestVitals] = useState(null);
  const [loadingVitals, setLoadingVitals] = useState(false);

  const handleDeassignClick = (bed) => {
    if (deassignBed) {
      setDischargeDialogOpen(true);
    }
  };

  const handleDischargeClose = () => {
    setDischargeDialogOpen(false);
  };

  const handleDischargeSuccess = () => {
    setDischargeDialogOpen(false);
    // Call the parent's deassignBed function to refresh the bed data
    if (deassignBed) {
      deassignBed(bed);
    }
  };

  const handleRecordVitalsClick = () => {
    setVitalsFormOpen(true);
  };

  const handleVitalsFormClose = () => {
    setVitalsFormOpen(false);
  };

  const handleVitalsFormSave = () => {
    // Refresh latest vitals after save
    if (patient?.id) {
      fetchLatestVitals();
    }
  };

  const fetchLatestVitals = async () => {
    if (!patient?.id) return;
    
    setLoadingVitals(true);
    try {
      const vitals = await fetchLatestVitalSigns(patient.id);
      if (vitals && vitals.length > 0) {
        setLatestVitals(vitals[0]);
      } else {
        setLatestVitals(null);
      }
    } catch (error) {
      console.error("Error fetching vitals:", error);
      setLatestVitals(null);
    } finally {
      setLoadingVitals(false);
    }
  };

  const handleCardClick = () => {
    if (isOccupied && patient) {
      setDetailDialogOpen(true);
      fetchLatestVitals();
    }
  };

  const isOccupied = bed.patientId !== null;
  const patient = bed.Patient;

  return (
    <>
      <StyledCard occupied={isOccupied} onClick={handleCardClick}>
        <CardContent sx={{ flexGrow: 1, display: "flex", flexDirection: "column", pt: 1.5, pb: 1.5, px: 1.5 }}>
          {/* Bed Header */}
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1, mt: 0 }}>
            <Typography variant="h6" component="div" color="primary">
              Bed {bed.bedNumber}
            </Typography>
            <Chip
              label={isOccupied ? "Occupied" : "Available"}
              color={isOccupied ? "error" : "success"}
              size="small"
            />
          </Box>

          {isOccupied && patient ? (
            <>
              {/* Patient Avatar and Basic Info */}
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <Avatar sx={{ bgcolor: "primary.main", mr: 1.5 }}>
                  <Person />
                </Avatar>
                <Box>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {patient.fullName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    ID: {patient.patientNumber}
                  </Typography>
                </Box>
              </Box>

              {/* Patient Details */}
              <Box sx={{ mb: 1 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Wc sx={{ fontSize: "16px", color: "primary.main" }} />
                  <Typography variant="body2">
                    <strong>Gender:</strong> {patient.gender}
                  </Typography>
                </Box>
              </Box>

              {/* Action Buttons */}
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 1.5,
                  width: "100%",
                  mt: 1
                }}
              >
                {/* View Details Button */}
                <Button
                  variant="contained"
                  size="medium"
                  fullWidth
                  sx={{
                    textTransform: "none",
                    fontSize: "14px",
                    fontWeight: "500",
                    borderRadius: "6px",
                    backgroundColor: "#3498db",
                    color: "white",
                    paddingX: 2.5,
                    paddingY: 1.2,
                    boxShadow: "none",
                    border: "none",
                    "&:hover": {
                      backgroundColor: "#2980b9",
                      boxShadow: "0 2px 8px rgba(52, 152, 219, 0.3)",
                      transform: "none",
                    },
                    "&:active": {
                      backgroundColor: "#21618c",
                      transform: "none",
                    },
                    transition: "all 0.2s ease",
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCardClick();
                  }}
                >
                  View Full Details
                </Button>
                <Tooltip title="Discharge patient with medical documentation" placement="top">
                  {deassignBed && (
                    <Button
                      variant="contained"
                      size="medium"
                      aria-label="Discharge patient"
                      sx={{
                        textTransform: "none",
                        fontSize: "14px",
                        fontWeight: "500",
                        borderRadius: "6px",
                        backgroundColor: "#e74c3c",
                        color: "white",
                        paddingX: 2.5,
                        paddingY: 1.2,
                        boxShadow: "none",
                        border: "none",
                        "&:hover": {
                          backgroundColor: "#c0392b",
                          boxShadow: "0 2px 8px rgba(231, 76, 60, 0.3)",
                          transform: "none",
                        },
                        "&:active": {
                          backgroundColor: "#a93226",
                          transform: "none",
                        },
                        width: "100%",
                        transition: "all 0.2s ease",
                      }}
                      startIcon={<RemoveIcon sx={{ fontSize: "18px" }} />}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeassignClick(bed);
                      }}
                    >
                      Discharge Patient
                    </Button>
                  )}
                </Tooltip>
                <Tooltip title="Update patient vital signs and medical data" placement="top">
                  <Button
                    variant="contained"
                    size="medium"
                    aria-label="Update patient vitals"
                    sx={{
                      textTransform: "none",
                      fontSize: "14px",
                      fontWeight: "500",
                      borderRadius: "6px",
                      backgroundColor: "#27ae60",
                      color: "white",
                      paddingX: 2.5,
                      paddingY: 1.2,
                      boxShadow: "none",
                      border: "none",
                      "&:hover": {
                        backgroundColor: "#229954",
                        boxShadow: "0 2px 8px rgba(39, 174, 96, 0.3)",
                        transform: "none",
                      },
                      "&:active": {
                        backgroundColor: "#1e8449",
                        transform: "none",
                      },
                      width: "100%",
                      animation: bed.criticalStatus
                        ? "pulse 1.5s infinite"
                        : "none",
                      "@keyframes pulse": {
                        "0%": {
                          backgroundColor: "#27ae60",
                        },
                        "50%": {
                          backgroundColor: "#e74c3c",
                        },
                        "100%": {
                          backgroundColor: "#27ae60",
                        },
                      },
                      transition: "all 0.2s ease",
                    }}
                    startIcon={<AssignmentIcon sx={{ fontSize: "18px" }} />}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRecordVitalsClick();
                    }}
                  >
                    Update Vitals
                  </Button>
                </Tooltip>
              </Box>
            </>
          ) : (
            <>
              {/* Available Bed Content */}
              <Box sx={{ textAlign: "center", flexGrow: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <Hotel sx={{ fontSize: 60, color: "success.main", mb: 2 }} />
                <Typography variant="h6" color="success.main" gutterBottom>
                  Available
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  {assignBed ? "Click to assign a patient" : "Bed is available"}
                </Typography>
              </Box>

              {/* Assign Patient Button - Only show if assignBed function is provided */}
              {assignBed && (
                <Tooltip title="Assign a new patient to this bed" placement="top">
                  <Button
                    variant="contained"
                    size="medium"
                    aria-label="Assign patient to bed"
                    sx={{
                      textTransform: "none",
                      fontSize: "14px",
                      fontWeight: "500",
                      borderRadius: "6px",
                      backgroundColor: "#3498db",
                      color: "white",
                      paddingX: 2.5,
                      paddingY: 1.2,
                      boxShadow: "none",
                      border: "none",
                      "&:hover": {
                        backgroundColor: "#2980b9",
                        boxShadow: "0 2px 8px rgba(52, 152, 219, 0.3)",
                        transform: "none",
                      },
                      "&:active": {
                        backgroundColor: "#21618c",
                        transform: "none",
                      },
                      transition: "all 0.2s ease",
                    }}
                    startIcon={<Hotel sx={{ fontSize: "18px" }} />}
                    onClick={() => assignBed(bed)}
                  >
                    Assign Patient
                  </Button>
                </Tooltip>
              )}
            </>
          )}
        </CardContent>
      </StyledCard>

      {/* Patient Details Dialog */}
      <Dialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
          }
        }}
      >
        <DialogTitle sx={{ m: 0, p: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Person sx={{ mr: 1, color: "primary.main" }} />
            <Typography variant="h6">Patient Details - Bed {bed.bedNumber}</Typography>
          </Box>
          <IconButton
            aria-label="close"
            onClick={() => setDetailDialogOpen(false)}
            sx={{ color: "grey.500" }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {patient && (
            <Grid container spacing={3}>
              {/* Basic Information */}
              <Grid item xs={12} md={6}>
                <DetailSection title="Basic Information" icon={<Person sx={{ color: "primary.main" }} />}>
                  <DetailItem label="Full Name" value={patient.fullName} />
                  <DetailItem label="Patient ID" value={patient.patientNumber} />
                  <DetailItem label="Gender" value={patient.gender} />
                  <DetailItem label="Date of Birth" value={patient.dateOfBirth} />
                  <DetailItem label="Age" value={patient.age} />
                  <DetailItem label="Marital Status" value={patient.maritalStatus} />
                  <DetailItem label="Contact Number" value={patient.contactNumber} icon={<Phone sx={{ fontSize: "16px" }} />} />
                  <DetailItem label="Email" value={patient.email} icon={<Email sx={{ fontSize: "16px" }} />} />
                  <DetailItem label="Address" value={patient.address} icon={<LocationOn sx={{ fontSize: "16px" }} />} />
                </DetailSection>
              </Grid>

              {/* Medical Information */}
              <Grid item xs={12} md={6}>
                <DetailSection title="Medical Information" icon={<MedicalServices sx={{ color: "primary.main" }} />}>
                  <DetailItem label="Blood Type" value={patient.bloodType} icon={<Bloodtype sx={{ fontSize: "16px" }} />} />
                  <DetailItem label="Known Allergies" value={patient.knownAllergies} icon={<Warning sx={{ fontSize: "16px" }} />} />
                  <DetailItem label="Medical History" value={patient.medicalHistory} icon={<History sx={{ fontSize: "16px" }} />} />
                  <DetailItem label="Current Medications" value={patient.currentMedications} icon={<Medication sx={{ fontSize: "16px" }} />} />
                  <DetailItem label="Pregnancy Status" value={patient.pregnancyStatus} icon={<PregnantWoman sx={{ fontSize: "16px" }} />} />
                </DetailSection>
              </Grid>

              {/* Critical Details */}
              <Grid item xs={12}>
                <DetailSection title="Critical Details" icon={<Emergency sx={{ color: "error.main" }} />}>
                  {loadingVitals ? (
                    <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
                      <CircularProgress size={24} />
                    </Box>
                  ) : latestVitals ? (
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={3}>
                        <DetailItem 
                          label="Heart Rate" 
                          value={`${latestVitals.heartRate} bpm`} 
                          icon={<AssignmentIcon sx={{ fontSize: "16px" }} />} 
                        />
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <DetailItem 
                          label="Blood Pressure" 
                          value={`${latestVitals.bloodPressureSystolic}/${latestVitals.bloodPressureDiastolic} mmHg`} 
                          icon={<AssignmentIcon sx={{ fontSize: "16px" }} />} 
                        />
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <DetailItem 
                          label="Temperature" 
                          value={`${latestVitals.temperature} °C`} 
                          icon={<AssignmentIcon sx={{ fontSize: "16px" }} />} 
                        />
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <DetailItem 
                          label="SpO2" 
                          value={`${latestVitals.spO2}%`} 
                          icon={<AssignmentIcon sx={{ fontSize: "16px" }} />} 
                        />
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <DetailItem 
                          label="Respiratory Rate" 
                          value={`${latestVitals.respiratoryRate} breaths/min`} 
                          icon={<AssignmentIcon sx={{ fontSize: "16px" }} />} 
                        />
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <DetailItem 
                          label="Glasgow Coma Scale" 
                          value={latestVitals.glasgowComaScale} 
                          icon={<AssignmentIcon sx={{ fontSize: "16px" }} />} 
                        />
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <DetailItem 
                          label="Pain Scale" 
                          value={`${latestVitals.painScale}/10`} 
                          icon={<AssignmentIcon sx={{ fontSize: "16px" }} />} 
                        />
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <DetailItem 
                          label="Blood Glucose" 
                          value={`${latestVitals.bloodGlucose} mg/dL`} 
                          icon={<AssignmentIcon sx={{ fontSize: "16px" }} />} 
                        />
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <DetailItem 
                          label="Urine Output" 
                          value={`${latestVitals.urineOutput} mL/kg/hr`} 
                          icon={<AssignmentIcon sx={{ fontSize: "16px" }} />} 
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <DetailItem 
                          label="Last Updated" 
                          value={latestVitals.recordedAt ? new Date(latestVitals.recordedAt).toLocaleString() : "Not available"} 
                          icon={<History sx={{ fontSize: "16px" }} />} 
                        />
                      </Grid>
                    </Grid>
                  ) : (
                    <Box sx={{ textAlign: "center", py: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        No vital signs recorded yet. Click "Update Vitals" to record the first reading.
                      </Typography>
                    </Box>
                  )}
                </DetailSection>
              </Grid>

              {/* Emergency Contact */}
              <Grid item xs={12}>
                <DetailSection title="Emergency Contact" icon={<ContactEmergency sx={{ color: "primary.main" }} />}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                      <DetailItem label="Contact Name" value={patient.emergencyContactName} />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <DetailItem label="Relationship" value={patient.emergencyContactRelationship} />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <DetailItem label="Contact Number" value={patient.emergencyContactNumber} icon={<Phone sx={{ fontSize: "16px" }} />} />
                    </Grid>
                  </Grid>
                </DetailSection>
              </Grid>

              {/* Admission Information */}
              <Grid item xs={12}>
                <DetailSection title="Admission Information" icon={<Info sx={{ color: "primary.main" }} />}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <DetailItem label="Admission Date" value={patient.admissionDateTime} />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <DetailItem label="Department" value={patient.department} />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <DetailItem label="Initial Diagnosis" value={patient.initialDiagnosis} />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <DetailItem label="Consultant in Charge" value={patient.consultantInCharge} />
                    </Grid>
                  </Grid>
                </DetailSection>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
          <Button
            onClick={() => setDocumentsDialogOpen(true)}
            variant="contained"
            sx={{
              textTransform: "none",
              borderRadius: "6px",
              bgcolor: "primary.main",
              "&:hover": {
                bgcolor: "primary.dark",
              },
            }}
          >
            View Documents
          </Button>
          <Button
            onClick={() => setDetailDialogOpen(false)}
            variant="outlined"
            sx={{
              textTransform: "none",
              borderRadius: "6px",
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Discharge Dialog */}
      <DischargeDialog
        open={dischargeDialogOpen}
        onClose={handleDischargeClose}
        onDischarge={handleDischargeSuccess}
        bed={bed}
        patient={patient}
      />

      {/* Vitals Form Dialog */}
      {patient && (
        <CriticalFactorsForm
          open={vitalsFormOpen}
          onClose={handleVitalsFormClose}
          onSave={handleVitalsFormSave}
          patientId={patient.id}
          bedNumber={bed.bedNumber}
        />
      )}

      {/* Patient Documents Viewer */}
      {patient && (
        <PatientDocumentsViewer
          open={documentsDialogOpen}
          onClose={() => setDocumentsDialogOpen(false)}
          patientId={patient.id}
        />
      )}
    </>
  );
};

export default BedCard;
