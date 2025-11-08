import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Alert,
  Chip,
  Grid,
  Card,
  CardContent,
} from "@mui/material";
import {
  Person,
  Phone,
  CalendarToday,
  LocationOn,
  Wc,
  Assignment,
  Download as DownloadIcon,
} from "@mui/icons-material";
import { useSelector, useDispatch } from "react-redux";
import { setLoading } from "../features/loaderSlice";
import { showToast } from "../features/ui/uiSlice";
import { setDialogOpen } from "../features/patients/patientSlice";
import { jsPDF } from "jspdf";
import { getPatientById, getPatientChangeHistory } from "../api/patientApi";
import { fetchLatestVitalSigns } from "../api/vitalSignsApi";

/**
 * Discharge Dialog component for discharging patients from beds
 * Collects discharge information and creates discharge records
 * @param {boolean} open - Controls dialog visibility
 * @param {Function} onClose - Callback when dialog is closed
 * @param {Function} onDischarge - Callback after successful discharge
 * @param {Object} bed - Bed object being discharged
 * @param {Object} patient - Patient object being discharged
 */
const DischargeDialog = ({ open, onClose, onDischarge, bed, patient }) => {
  const [dischargeData, setDischargeData] = useState({
    dischargeReason: "",
    doctorComments: "",
    dischargeInstructions: "",
    followUpRequired: false,
    followUpDate: "",
    medicationsPrescribed: "",
  });

  const [errors, setErrors] = useState({});
  const [downloadingReport, setDownloadingReport] = useState(false);
  const dispatch = useDispatch();
  const token = useSelector((state) => state.auth.token);

  const handleInputChange = (field, value) => {
    setDischargeData(prev => ({
      ...prev,
      [field]: value
    }));
    
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ""
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!dischargeData.dischargeReason.trim()) {
      newErrors.dischargeReason = "Discharge reason is required";
    }
    
    if (!dischargeData.doctorComments.trim()) {
      newErrors.doctorComments = "Doctor comments are required";
    }
    
    if (dischargeData.followUpRequired && !dischargeData.followUpDate) {
      newErrors.followUpDate = "Follow-up date is required when follow-up is needed";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    dispatch(setLoading(true));
    
    try {
      const BASE_URL = `${import.meta.env.VITE_API_URL}/api`;
      
      const dischargeResponse = await fetch(`${BASE_URL}/patients/${patient.id}/discharge`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          bedId: bed.id,
          ...dischargeData
        }),
      });

      if (!dischargeResponse.ok) {
        throw new Error("Failed to discharge patient");
      }

      const dischargeResult = await dischargeResponse.json();
      
      dispatch(
        showToast({
          message: "Patient discharged successfully. All patient data has been removed from the database.",
          type: "success",
        })
      );
      
      handleCancel();
      
      onDischarge();
      
    } catch (error) {
      console.error("Discharge error:", error);
      dispatch(
        showToast({
          message: "Failed to discharge patient. Please try again.",
          type: "error",
        })
      );
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleCancel = () => {
    setDischargeData({
      dischargeReason: "",
      doctorComments: "",
      dischargeInstructions: "",
      followUpRequired: false,
      followUpDate: "",
      medicationsPrescribed: "",
    });
    setErrors({});
    onClose();
  };

  const generateDischargeReport = async () => {
    if (!patient?.id) return;

    setDownloadingReport(true);
    dispatch(setLoading(true));

    try {
      // Fetch all patient data
      const [patientData, changeHistory, criticalFactors] = await Promise.all([
        getPatientById(patient.id),
        getPatientChangeHistory(patient.id),
        fetchLatestVitalSigns(patient.id),
      ]);

      const fullPatient = patientData.patient || patientData;
      const history = changeHistory.changeHistory || [];
      const vitals = Array.isArray(criticalFactors) ? criticalFactors : [];

      // Create PDF
      const doc = new jsPDF();
      let yPos = 20;
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      const contentWidth = pageWidth - 2 * margin;

      // Helper function to add text with word wrap
      const addText = (text, fontSize = 10, isBold = false, color = [0, 0, 0]) => {
        doc.setFontSize(fontSize);
        doc.setTextColor(color[0], color[1], color[2]);
        if (isBold) {
          doc.setFont(undefined, "bold");
        } else {
          doc.setFont(undefined, "normal");
        }
        
        const lines = doc.splitTextToSize(text, contentWidth);
        if (yPos + lines.length * (fontSize * 0.4) > doc.internal.pageSize.getHeight() - 20) {
          doc.addPage();
          yPos = 20;
        }
        doc.text(lines, margin, yPos);
        yPos += lines.length * (fontSize * 0.4) + 5;
      };

      // Title
      addText("PATIENT DISCHARGE REPORT", 18, true, [0, 0, 0]);
      yPos += 5;

      // Report Date
      addText(`Report Generated: ${new Date().toLocaleString()}`, 10, false, [100, 100, 100]);
      yPos += 10;

      // Patient Information Section
      addText("PATIENT INFORMATION", 14, true, [0, 0, 0]);
      addText(`Name: ${fullPatient.fullName || patient.fullName || "N/A"}`, 11);
      addText(`Patient ID: ${fullPatient.patientNumber || patient.patientNumber || "N/A"}`, 11);
      addText(`Date of Birth: ${fullPatient.dateOfBirth || patient.dateOfBirth || "N/A"}`, 11);
      addText(`Age: ${fullPatient.age || patient.age || "N/A"}`, 11);
      addText(`Gender: ${fullPatient.gender || patient.gender || "N/A"}`, 11);
      addText(`Contact Number: ${fullPatient.contactNumber || patient.contactNumber || "N/A"}`, 11);
      addText(`Email: ${fullPatient.email || patient.email || "N/A"}`, 11);
      addText(`Address: ${fullPatient.address || patient.address || "N/A"}`, 11);
      addText(`NIC/Passport: ${fullPatient.nicPassport || patient.nicPassport || "N/A"}`, 11);
      addText(`Bed Number: ${bed?.bedNumber || "N/A"}`, 11);
      yPos += 5;

      // Medical Information Section
      if (fullPatient.medicalRecords && fullPatient.medicalRecords.length > 0) {
        const medicalRecord = fullPatient.medicalRecords[0];
        addText("CLINICAL HISTORY", 14, true, [0, 0, 0]);
        addText(`Known Allergies: ${medicalRecord.knownAllergies || "None"}`, 11);
        addText(`Medical History: ${medicalRecord.medicalHistory || "None"}`, 11);
        addText(`Current Medications: ${medicalRecord.currentMedications || "None"}`, 11);
        addText(`Blood Type: ${medicalRecord.bloodType || "N/A"}`, 11);
        addText(`Initial Diagnosis: ${medicalRecord.initialDiagnosis || "N/A"}`, 11);
        if (medicalRecord.pregnancyStatus) {
          addText(`Pregnancy Status: ${medicalRecord.pregnancyStatus}`, 11);
        }
        yPos += 5;
      }

      // Admission Information
      if (fullPatient.admissions && fullPatient.admissions.length > 0) {
        const admission = fullPatient.admissions[0];
        addText("ADMISSION INFORMATION", 14, true, [0, 0, 0]);
        addText(`Admission Date: ${admission.admissionDateTime ? new Date(admission.admissionDateTime).toLocaleString() : "N/A"}`, 11);
        addText(`Department: ${admission.department || "N/A"}`, 11);
        addText(`Consultant in Charge: ${admission.consultantInCharge || "N/A"}`, 11);
        yPos += 5;
      }

      // Critical Factors / Vital Signs History
      if (vitals && vitals.length > 0) {
        addText("VITAL SIGNS HISTORY", 14, true, [0, 0, 0]);
        vitals.slice(0, 20).forEach((vital, index) => {
          addText(`Record ${index + 1} - ${vital.recordedAt ? new Date(vital.recordedAt).toLocaleString() : "N/A"}`, 10, true);
          const vitalData = [];
          if (vital.heartRate) vitalData.push(`HR: ${vital.heartRate} bpm`);
          if (vital.respiratoryRate) vitalData.push(`RR: ${vital.respiratoryRate} /min`);
          if (vital.bloodPressureSystolic && vital.bloodPressureDiastolic) {
            vitalData.push(`BP: ${vital.bloodPressureSystolic}/${vital.bloodPressureDiastolic} mmHg`);
          }
          if (vital.spO2) vitalData.push(`SpO2: ${vital.spO2}%`);
          if (vital.temperature) vitalData.push(`Temp: ${vital.temperature}°C`);
          if (vital.bloodGlucose) vitalData.push(`Glucose: ${vital.bloodGlucose} mg/dL`);
          if (vital.glasgowComaScale) vitalData.push(`GCS: ${vital.glasgowComaScale}`);
          if (vital.painScale) vitalData.push(`Pain: ${vital.painScale}/10`);
          if (vital.urineOutput) vitalData.push(`Urine Output: ${vital.urineOutput} ml`);
          
          if (vital.dynamicVitals && typeof vital.dynamicVitals === 'object') {
            Object.entries(vital.dynamicVitals).forEach(([key, value]) => {
              vitalData.push(`${key}: ${value}`);
            });
          }
          
          if (vitalData.length > 0) {
            addText(vitalData.join(" | "), 10);
          }
          yPos += 3;
        });
        yPos += 5;
      }

      // Change History
      if (history && history.length > 0) {
        addText("CHANGE HISTORY", 14, true, [0, 0, 0]);
        history.slice(0, 30).forEach((change, index) => {
          const tableName = change.tableName || "Unknown";
          const action = change.action || "Unknown";
          const timestamp = change.timestamp ? new Date(change.timestamp).toLocaleString() : "N/A";
          const user = change.user ? (change.user.nameWithInitials || change.user.username) : "Unknown";
          
          addText(`${index + 1}. ${tableName} - ${action} by ${user} on ${timestamp}`, 10, true);
          if (change.description) {
            addText(`   ${change.description}`, 9);
          }
          yPos += 2;
        });
        yPos += 5;
      }

      // Discharge Information
      addText("DISCHARGE INFORMATION", 14, true, [0, 0, 0]);
      addText(`Discharge Reason: ${dischargeData.dischargeReason || "Not specified"}`, 11);
      addText(`Doctor Comments: ${dischargeData.doctorComments || "Not specified"}`, 11);
      addText(`Discharge Instructions: ${dischargeData.dischargeInstructions || "None provided"}`, 11);
      addText(`Medications Prescribed: ${dischargeData.medicationsPrescribed || "None specified"}`, 11);
      yPos += 5;

      // Follow-up Information
      if (dischargeData.followUpRequired) {
        addText("FOLLOW-UP INFORMATION", 14, true, [0, 0, 0]);
        addText(`Follow-up Required: Yes`, 11, true);
        addText(`Follow-up Date: ${dischargeData.followUpDate ? new Date(dischargeData.followUpDate).toLocaleDateString() : "N/A"}`, 11);
        yPos += 5;
      }

      // Footer
      yPos = doc.internal.pageSize.getHeight() - 20;
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text("This is an official medical discharge report. Generated by HDU Management System.", margin, yPos);

      // Save PDF
      const fileName = `Discharge_Report_${fullPatient.patientNumber || patient.id}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);

      dispatch(
        showToast({
          message: "Discharge report downloaded successfully",
          type: "success",
        })
      );
    } catch (error) {
      console.error("Error generating discharge report:", error);
      dispatch(
        showToast({
          message: "Failed to generate discharge report. Please try again.",
          type: "error",
        })
      );
    } finally {
      setDownloadingReport(false);
      dispatch(setLoading(false));
    }
  };

  const handleDownloadAndDischarge = async () => {
    if (!validateForm()) {
      return;
    }

    // First download the report
    await generateDischargeReport();
    
    // Then proceed with discharge
    await handleSubmit();
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleCancel}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
        }
      }}
    >
      <DialogTitle sx={{ 
        bgcolor: "primary.main", 
        color: "white",
        display: "flex",
        alignItems: "center",
        gap: 1
      }}>
        <Assignment />
        Patient Discharge Process
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {/* Patient Information Card */}
        <Card sx={{ mb: 3, bgcolor: "grey.50" }}>
          <CardContent>
            <Typography variant="h6" gutterBottom color="primary">
              Patient Information
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                  <Person color="primary" />
                  <Typography variant="body2">
                    <strong>Name:</strong> {patient?.fullName}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                  <Wc color="primary" />
                  <Typography variant="body2">
                    <strong>Gender:</strong> {patient?.gender}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                  <CalendarToday color="primary" />
                  <Typography variant="body2">
                    <strong>DOB:</strong> {patient?.dateOfBirth}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                  <Phone color="primary" />
                  <Typography variant="body2">
                    <strong>Contact:</strong> {patient?.contactNumber}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                  <LocationOn color="primary" />
                  <Typography variant="body2">
                    <strong>Address:</strong> {patient?.address}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Chip 
                    label={`Bed ${bed?.bedNumber}`} 
                    color="secondary" 
                    size="small"
                  />
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Discharge Form */}
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Discharge Reason *"
              value={dischargeData.dischargeReason}
              onChange={(e) => handleInputChange("dischargeReason", e.target.value)}
              error={!!errors.dischargeReason}
              helperText={errors.dischargeReason || "Primary reason for discharge"}
              multiline
              rows={2}
              placeholder="e.g., Recovery complete, Treatment finished, Patient request"
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Doctor Comments *"
              value={dischargeData.doctorComments}
              onChange={(e) => handleInputChange("doctorComments", e.target.value)}
              error={!!errors.doctorComments}
              helperText={errors.doctorComments || "Medical assessment and discharge notes"}
              multiline
              rows={4}
              placeholder="Enter detailed medical comments, patient condition, treatment outcomes, and any concerns..."
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Discharge Instructions"
              value={dischargeData.dischargeInstructions}
              onChange={(e) => handleInputChange("dischargeInstructions", e.target.value)}
              multiline
              rows={3}
              placeholder="Instructions for patient care, medications, diet, activity restrictions..."
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Medications Prescribed"
              value={dischargeData.medicationsPrescribed}
              onChange={(e) => handleInputChange("medicationsPrescribed", e.target.value)}
              multiline
              rows={2}
              placeholder="List medications, dosages, and duration..."
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Box>
                <Typography variant="body2" gutterBottom>
                  Follow-up Required
                </Typography>
                <Button
                  variant={dischargeData.followUpRequired ? "contained" : "outlined"}
                  color={dischargeData.followUpRequired ? "primary" : "default"}
                  onClick={() => handleInputChange("followUpRequired", !dischargeData.followUpRequired)}
                  size="small"
                >
                  {dischargeData.followUpRequired ? "Yes" : "No"}
                </Button>
              </Box>
              
              {dischargeData.followUpRequired && (
                <TextField
                  fullWidth
                  type="date"
                  label="Follow-up Date *"
                  value={dischargeData.followUpDate}
                  onChange={(e) => handleInputChange("followUpDate", e.target.value)}
                  error={!!errors.followUpDate}
                  helperText={errors.followUpDate}
                  InputLabelProps={{ shrink: true }}
                />
              )}
            </Box>
          </Grid>
        </Grid>

        {/* Warning Alert */}
        <Alert severity="warning" sx={{ mt: 3 }}>
          <Typography variant="body2">
            <strong>Important:</strong> This action will permanently discharge the patient and release the bed. 
            All discharge information will be recorded in the patient's medical history.
          </Typography>
        </Alert>
      </DialogContent>

      <DialogActions sx={{ p: 3, gap: 2 }}>
        <Button 
          onClick={handleCancel}
          variant="outlined"
          color="secondary"
        >
          Cancel
        </Button>
        <Button 
          onClick={generateDischargeReport}
          variant="outlined"
          color="primary"
          startIcon={<DownloadIcon />}
          disabled={downloadingReport}
          sx={{ textTransform: "none" }}
        >
          Download Report
        </Button>
        <Button 
          onClick={handleSubmit}
          variant="outlined"
          color="error"
          sx={{ textTransform: "none" }}
        >
          Discharge
        </Button>
        <Button 
          onClick={handleDownloadAndDischarge}
          variant="contained"
          color="primary"
          sx={{
            bgcolor: "#e74c3c",
            "&:hover": {
              bgcolor: "#c0392b",
            },
          }}
        >
          Download Report & Discharge
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DischargeDialog; 