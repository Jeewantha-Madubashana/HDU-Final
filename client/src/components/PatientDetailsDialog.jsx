import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Grid,
  Typography,
  IconButton,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
} from "@mui/material";
import {
  Close as CloseIcon,
  Person,
  Phone,
  Email,
  LocationOn,
  MedicalServices,
  History,
  Medication,
  Bloodtype,
  PregnantWoman,
  Warning,
  ContactEmergency,
  LocalHospital,
  CalendarToday,
  Assignment as AssignmentIcon,
} from "@mui/icons-material";
import { fetchLatestVitalSigns } from "../api/vitalSignsApi";

const PatientDetailsDialog = ({ open, onClose, patient, bedNumber }) => {
  const [criticalFactors, setCriticalFactors] = useState([]);
  const [loadingFactors, setLoadingFactors] = useState(false);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    if (open && patient?.id) {
      fetchCriticalFactors();
    }
  }, [open, patient?.id]);

  const fetchCriticalFactors = async () => {
    if (!patient?.id) return;
    
    setLoadingFactors(true);
    setError(null);
    try {
      const factors = await fetchLatestVitalSigns(patient.id);
      setCriticalFactors(Array.isArray(factors) ? factors : []);
    } catch (err) {
      setError(err.message || "Failed to fetch critical factors history");
      setCriticalFactors([]);
    } finally {
      setLoadingFactors(false);
    }
  };

  const DetailItem = ({ label, value, icon }) => (
    <Box sx={{ display: "flex", alignItems: "center", mb: 1.5 }}>
      {icon && <Box sx={{ mr: 1, color: "primary.main" }}>{icon}</Box>}
      <Typography variant="body2" sx={{ fontWeight: "500", minWidth: "140px" }}>
        {label}:
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {value || "Not specified"}
      </Typography>
    </Box>
  );

  const DetailSection = ({ title, icon, children }) => (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
        {icon}
        <Typography variant="h6" sx={{ ml: 1, fontWeight: "bold" }}>
          {title}
        </Typography>
      </Box>
      {children}
    </Box>
  );

  if (!patient) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          maxHeight: "90vh",
          borderRadius: "8px",
        },
      }}
    >
      <DialogTitle
        sx={{
          m: 0,
          p: 2,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid #e0e0e0",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Person sx={{ mr: 1, color: "primary.main" }} />
          <Box>
            <Typography variant="h6">
              Patient Details - {patient.fullName || "N/A"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Bed: {bedNumber || "N/A"} | Patient ID: {patient.patientNumber || "N/A"}
            </Typography>
          </Box>
        </Box>
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{ color: "grey.500" }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 3 }}>
        <Tabs
          value={tabValue}
          onChange={(e, newValue) => setTabValue(newValue)}
          sx={{ mb: 3 }}
        >
          <Tab label="Patient Information" />
          <Tab label="Clinical History (Critical Factors)" />
        </Tabs>

        {/* Patient Information Tab */}
        {tabValue === 0 && (
          <Box>
            <Grid container spacing={3}>
              {/* Basic Information */}
              <Grid item xs={12} md={6}>
                <DetailSection
                  title="Basic Information"
                  icon={<Person sx={{ color: "primary.main" }} />}
                >
                  <DetailItem
                    label="Full Name"
                    value={patient.fullName}
                    icon={<Person sx={{ fontSize: "16px" }} />}
                  />
                  <DetailItem
                    label="Patient ID"
                    value={patient.patientNumber}
                  />
                  <DetailItem
                    label="Gender"
                    value={patient.gender}
                  />
                  <DetailItem
                    label="Date of Birth"
                    value={patient.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString() : "N/A"}
                    icon={<CalendarToday sx={{ fontSize: "16px" }} />}
                  />
                  <DetailItem
                    label="Age"
                    value={patient.age}
                  />
                  <DetailItem
                    label="Marital Status"
                    value={patient.maritalStatus}
                  />
                  <DetailItem
                    label="Contact Number"
                    value={patient.contactNumber}
                    icon={<Phone sx={{ fontSize: "16px" }} />}
                  />
                  <DetailItem
                    label="Email"
                    value={patient.email}
                    icon={<Email sx={{ fontSize: "16px" }} />}
                  />
                  <DetailItem
                    label="Address"
                    value={patient.address}
                    icon={<LocationOn sx={{ fontSize: "16px" }} />}
                  />
                </DetailSection>
              </Grid>

              {/* Medical Information */}
              <Grid item xs={12} md={6}>
                <DetailSection
                  title="Medical Information"
                  icon={<MedicalServices sx={{ color: "primary.main" }} />}
                >
                  <DetailItem
                    label="Blood Type"
                    value={patient.bloodType}
                    icon={<Bloodtype sx={{ fontSize: "16px" }} />}
                  />
                  <DetailItem
                    label="Known Allergies"
                    value={patient.knownAllergies}
                    icon={<Warning sx={{ fontSize: "16px" }} />}
                  />
                  <DetailItem
                    label="Medical History"
                    value={patient.medicalHistory}
                    icon={<History sx={{ fontSize: "16px" }} />}
                  />
                  <DetailItem
                    label="Current Medications"
                    value={patient.currentMedications}
                    icon={<Medication sx={{ fontSize: "16px" }} />}
                  />
                  <DetailItem
                    label="Pregnancy Status"
                    value={patient.pregnancyStatus}
                    icon={<PregnantWoman sx={{ fontSize: "16px" }} />}
                  />
                  <DetailItem
                    label="Initial Diagnosis"
                    value={patient.initialDiagnosis}
                    icon={<LocalHospital sx={{ fontSize: "16px" }} />}
                  />
                </DetailSection>
              </Grid>

              {/* Emergency Contact */}
              {patient.emergencyContactName && (
                <Grid item xs={12}>
                  <DetailSection
                    title="Emergency Contact"
                    icon={<ContactEmergency sx={{ color: "error.main" }} />}
                  >
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={4}>
                        <DetailItem
                          label="Name"
                          value={patient.emergencyContactName}
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <DetailItem
                          label="Relationship"
                          value={patient.emergencyContactRelationship}
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <DetailItem
                          label="Contact Number"
                          value={patient.emergencyContactNumber}
                          icon={<Phone sx={{ fontSize: "16px" }} />}
                        />
                      </Grid>
                    </Grid>
                  </DetailSection>
                </Grid>
              )}

              {/* Admission Information */}
              {patient.admissionDateTime && (
                <Grid item xs={12}>
                  <DetailSection
                    title="Admission Information"
                    icon={<AssignmentIcon sx={{ color: "primary.main" }} />}
                  >
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={4}>
                        <DetailItem
                          label="Admission Date"
                          value={new Date(patient.admissionDateTime).toLocaleString()}
                          icon={<CalendarToday sx={{ fontSize: "16px" }} />}
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <DetailItem
                          label="Department"
                          value={patient.department}
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <DetailItem
                          label="Consultant In Charge"
                          value={patient.consultantInCharge}
                        />
                      </Grid>
                    </Grid>
                  </DetailSection>
                </Grid>
              )}
            </Grid>
          </Box>
        )}

        {/* Clinical History Tab */}
        {tabValue === 1 && (
          <Box>
            <DetailSection
              title="Critical Factors History"
              icon={<History sx={{ color: "primary.main" }} />}
            >
              {loadingFactors ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : error ? (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              ) : criticalFactors.length === 0 ? (
                <Alert severity="info">
                  No critical factors recorded yet for this patient.
                </Alert>
              ) : (
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell><strong>Date & Time</strong></TableCell>
                        <TableCell><strong>Recorded By</strong></TableCell>
                        <TableCell><strong>Heart Rate (bpm)</strong></TableCell>
                        <TableCell><strong>Blood Pressure (mmHg)</strong></TableCell>
                        <TableCell><strong>Respiratory Rate</strong></TableCell>
                        <TableCell><strong>Temperature (°C)</strong></TableCell>
                        <TableCell><strong>SpO2 (%)</strong></TableCell>
                        <TableCell><strong>GCS</strong></TableCell>
                        <TableCell><strong>Pain Scale</strong></TableCell>
                        <TableCell><strong>Blood Glucose</strong></TableCell>
                        <TableCell><strong>Urine Output</strong></TableCell>
                        <TableCell><strong>Status</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {criticalFactors.map((factor, index) => (
                        <TableRow
                          key={factor.id || index}
                          sx={{
                            "&:hover": { backgroundColor: "action.hover" },
                          }}
                        >
                          <TableCell>
                            {factor.recordedAt
                              ? new Date(factor.recordedAt).toLocaleString()
                              : "N/A"}
                          </TableCell>
                          <TableCell>
                            {factor.recorder?.nameWithInitials ||
                              factor.recorder?.username ||
                              "N/A"}
                          </TableCell>
                          <TableCell>
                            {factor.heartRate ? `${factor.heartRate}` : "-"}
                          </TableCell>
                          <TableCell>
                            {factor.bloodPressureSystolic &&
                            factor.bloodPressureDiastolic
                              ? `${factor.bloodPressureSystolic}/${factor.bloodPressureDiastolic}`
                              : "-"}
                          </TableCell>
                          <TableCell>
                            {factor.respiratoryRate ? `${factor.respiratoryRate}` : "-"}
                          </TableCell>
                          <TableCell>
                            {factor.temperature ? `${factor.temperature}` : "-"}
                          </TableCell>
                          <TableCell>
                            {factor.spO2 ? `${factor.spO2}` : "-"}
                          </TableCell>
                          <TableCell>
                            {factor.glasgowComaScale
                              ? `${factor.glasgowComaScale}`
                              : "-"}
                          </TableCell>
                          <TableCell>
                            {factor.painScale !== null &&
                            factor.painScale !== undefined
                              ? `${factor.painScale}/10`
                              : "-"}
                          </TableCell>
                          <TableCell>
                            {factor.bloodGlucose
                              ? `${factor.bloodGlucose} mg/dL`
                              : "-"}
                          </TableCell>
                          <TableCell>
                            {factor.urineOutput
                              ? `${factor.urineOutput} mL/kg/hr`
                              : "-"}
                          </TableCell>
                          <TableCell>
                            {factor.isAmended ? (
                              <Chip
                                label="Amended"
                                size="small"
                                color="warning"
                              />
                            ) : (
                              <Chip
                                label="Original"
                                size="small"
                                color="success"
                              />
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </DetailSection>

            {criticalFactors.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Total Records: {criticalFactors.length}
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, borderTop: "1px solid #e0e0e0" }}>
        <Button onClick={onClose} variant="contained" color="primary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PatientDetailsDialog;

